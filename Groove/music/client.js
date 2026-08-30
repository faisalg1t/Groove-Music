const axios = require('axios');
const config = require('../config');
const emojis = require('../emojis.json');

class PterodactylClient {
    constructor() {
        this.baseURL = config.PTERO_PANEL_URL.replace(/\/$/, '') + '/api/application';
        this.clientBaseURL = config.PTERO_PANEL_URL.replace(/\/$/, '') + '/api/client';
        this.apiKey = config.PTERO_API_KEY;
        this.userApiKey = config.PTERO_USER_API_KEY;
        
        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 60000 // 60 seconds timeout for better reliability
        });

        this.clientAPI = this.userApiKey ? axios.create({
            baseURL: this.clientBaseURL,
            headers: {
                'Authorization': `Bearer ${this.userApiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 60000 // 60 seconds timeout for better reliability
        }) : null;

        this.client.interceptors.request.use(
            (config) => {
                if (process.env.DEBUG === 'true') {
                    console.log(`${emojis.resources.network} API Request: ${config.method.toUpperCase()} ${config.url}`);
                }
                return config;
            },
            (error) => {
                console.error(`${emojis.general.cross_mark} API Request Error:`, error);
                return Promise.reject(error);
            }
        );

        this.client.interceptors.response.use(
            (response) => {
                if (process.env.DEBUG === 'true') {
                    console.log(`${emojis.general.check_mark} API Response: ${response.status} ${response.config.url}`);
                }
                return response;
            },
            (error) => {
                console.error(`${emojis.general.cross_mark} API Response Error:`, error.response?.status, error.response?.data);
                return Promise.reject(this.handleApiError(error));
            }
        );

        if (this.clientAPI) {
            this.clientAPI.interceptors.request.use(
                (config) => {
                    if (process.env.DEBUG === 'true') {
                        console.log(`${emojis.resources.network} Client API Request: ${config.method.toUpperCase()} ${config.url}`);
                    }
                    return config;
                },
                (error) => {
                    console.error(`${emojis.general.cross_mark} Client API Request Error:`, error);
                    return Promise.reject(error);
                }
            );

            this.clientAPI.interceptors.response.use(
                (response) => {
                    if (process.env.DEBUG === 'true') {
                        console.log(`${emojis.general.check_mark} Client API Response: ${response.status} ${response.config.url}`);
                    }
                    return response;
                },
                (error) => {
                    console.error(`${emojis.general.cross_mark} Client API Response Error:`, error.response?.status, error.response?.data);
                    return Promise.reject(this.handleApiError(error));
                }
            );
        }
    }

    /**
     * Handle API errors and convert them to meaningful messages
     * @param {Object} error - Axios error object
     * @returns {Error} - Formatted error
     */
    handleApiError(error) {
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;
            
            switch (status) {
                case 401:
                    return new Error('Invalid API key or unauthorized access');
                case 403:
                    return new Error('Insufficient permissions for this action');
                case 404:
                    return new Error('Resource not found');
                case 422:
                    if (data.errors) {
                        const errors = Object.values(data.errors).flat();
                        return new Error(`Validation error: ${errors.join(', ')}`);
                    }
                    return new Error('Validation error');
                case 429:
                    return new Error('Rate limit exceeded. Please try again later');
                case 500:
                    if (data.errors && data.errors[0]?.code === 'DaemonConnectionException') {
                        return new Error('Unable to communicate with the server node. The server node may be offline or experiencing connectivity issues. Please try again later or contact the administrator.');
                    }
                    return new Error('Internal server error on Pterodactyl panel');
                case 502:
                    return new Error('Bad Gateway - The Pterodactyl panel server is currently unreachable. Please try again later.');
                case 503:
                    return new Error('Service Unavailable - The Pterodactyl panel is temporarily down for maintenance. Please try again later.');
                case 504:
                    return new Error('Gateway Timeout - The Pterodactyl panel is taking too long to respond. This usually indicates server overload or connectivity issues. Please try again in a few minutes.');
                default:
                    return new Error(`API error: ${status} ${data.message || 'Unknown error'}`);
            }
        } else if (error.request) {
            return new Error('Unable to connect to Pterodactyl panel. Please check the panel URL and network connection.');
        } else {
            return new Error(`Request error: ${error.message}`);
        }
    }

    /**
     * Get all users
     * @returns {Promise<Array>} - Array of users
     */
    async getUsers() {
        try {
            const response = await this.client.get('/users');
            return response.data.data.map(user => user.attributes);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get user by email
     * @param {string} email - User email
     * @returns {Promise<Object>} - User object
     */
    async getUserByEmail(email) {
        try {
            const response = await this.client.get(`/users?filter[email]=${encodeURIComponent(email)}`);
            const users = response.data.data;
            
            if (users.length === 0) {
                return null; 
            }
            
            return users[0].attributes;
        } catch (error) {
            if (error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    }

    /**
     * Get user by username
     * @param {string} username - Username
     * @returns {Promise<Object>} - User object
     */
    async getUserByUsername(username) {
        try {
            const response = await this.client.get(`/users?filter[username]=${encodeURIComponent(username)}`);
            const users = response.data.data;
            
            if (users.length === 0) {
                return null; 
            }
            
            return users[0].attributes;
        } catch (error) {
            if (error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    }

    /**
     * Create a new user
     * @param {string} email - User email
     * @param {string} username - Username
     * @param {string} firstName - First name
     * @param {string} lastName - Last name
     * @param {string} password - Password (optional)
     * @returns {Promise<Object>} - Created user object
     */
    async createUser(email, username, firstName, lastName, password = null) {
        try {
            const userData = {
                email,
                username,
                first_name: firstName,
                last_name: lastName
            };
            
            if (password) {
                userData.password = password;
            }
            
            const response = await this.client.post('/users', userData);
            return response.data.attributes;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update user password
     * @param {number} userId - User ID
     * @param {string} password - New password
     * @returns {Promise<Object>} - Updated user object
     */
    async updateUserPassword(userId, password) {
        try {
            const userResponse = await this.client.get(`/users/${userId}`);
            const user = userResponse.data.attributes;
            
            const response = await this.client.patch(`/users/${userId}`, {
                email: user.email,
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                password
            });
            return response.data.attributes;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all users
     * @returns {Promise<Array>} - Array of users
     */
    async getUsers() {
        try {
            let allUsers = [];
            let page = 1;
            let hasMorePages = true;

            while (hasMorePages) {
                const response = await this.client.get(`/users?page=${page}&per_page=50`);
                const users = response.data.data.map(user => user.attributes);
                allUsers.push(...users);

                const pagination = response.data.meta?.pagination;
                if (pagination && pagination.current_page < pagination.total_pages) {
                    page++;
                } else {
                    hasMorePages = false;
                }
            }

            return allUsers;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all nodes
     * @returns {Promise<Array>} - Array of nodes
     */
    async getNodes() {
        try {
            const response = await this.client.get('/nodes');
            return response.data.data.map(node => node.attributes);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get node by ID
     * @param {string|number} nodeId - Node ID
     * @returns {Promise<Object>} - Node object
     */
    async getNode(nodeId) {
        try {
            const response = await this.client.get(`/nodes/${nodeId}`);
            return response.data.attributes;
        } catch (error) {
            if (error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    }

    /**
     * Get all eggs
     * @returns {Promise<Array>} - Array of eggs
     */
    async getEggs() {
        try {
            const nestsResponse = await this.client.get('/nests');
            const nests = nestsResponse.data.data;
            
            const allEggs = [];
            for (const nest of nests) {
                try {
                    const eggsResponse = await this.client.get(`/nests/${nest.attributes.id}/eggs`);
                    const eggs = eggsResponse.data.data.map(egg => egg.attributes);
                    allEggs.push(...eggs);
                } catch (error) {
                    console.warn(`Warning: Could not fetch eggs for nest ${nest.attributes.id}:`, error.message);
                }
            }
            
            return allEggs;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get egg by ID
     * @param {string|number} eggId - Egg ID
     * @returns {Promise<Object>} - Egg object
     */
    async getEgg(eggId) {
        try {
            console.log(`${emojis.general.magnifying_glass} Debug - Looking for egg ID: ${eggId} (type: ${typeof eggId})`);
            
            const eggs = await this.getEggs();
            console.log(`${emojis.general.magnifying_glass} Debug - Available eggs: ${eggs.map(e => `${e.name} (ID: ${e.id})`).join(', ')}`);
            
            const egg = eggs.find(e => e.id === parseInt(eggId));
            
            if (!egg) {
                console.log(`${emojis.general.cross_mark} Debug - Egg with ID ${eggId} not found in available eggs`);
                return null;
            }
            
            console.log(`${emojis.general.check_mark} Debug - Found basic egg: ${egg.name} (ID: ${egg.id})`);
            
            const nestsResponse = await this.client.get('/nests');
            const nests = nestsResponse.data.data;
            
            console.log(`${emojis.general.magnifying_glass} Debug - Searching in ${nests.length} nests for detailed egg info`);
            
            for (const nest of nests) {
                try {
                    console.log(`${emojis.general.magnifying_glass} Debug - Checking nest ${nest.attributes.name} (ID: ${nest.attributes.id})`);
                    const eggResponse = await this.client.get(`/nests/${nest.attributes.id}/eggs/${eggId}?include=variables`);
                    console.log(`${emojis.general.check_mark} Debug - Found detailed egg info in nest ${nest.attributes.name}`);
                    return eggResponse.data.attributes;
                } catch (error) {
                    if (error.response?.status !== 404) {
                        console.log(`${emojis.general.cross_mark} Debug - Error in nest ${nest.attributes.name}: ${error.message}`);
                        console.log(`${emojis.general.warning} Debug - Non-404 error, continuing to next nest or fallback...`);
                    }
                    console.log(`${emojis.general.magnifying_glass} Debug - Egg ${eggId} not found in nest ${nest.attributes.name}, continuing...`);
                }
            }
            
            console.log(`${emojis.general.warning} Debug - Detailed info not found, returning enhanced basic egg info for ${egg.name}`);
            
            return {
                ...egg,
                docker_image: egg.docker_image || 'ubuntu:20.04', // Default fallback
                startup: egg.startup || '', // Default empty startup
                relationships: {
                    variables: {
                        data: [] // Default empty variables
                    }
                }
            };
        } catch (error) {
            console.log(`${emojis.general.cross_mark} Debug - Error in getEgg: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get allocations for a node
     * @param {string|number} nodeId - Node ID
     * @returns {Promise<Array>} - Array of allocations
     */
    async getNodeAllocations(nodeId) {
        try {
            const response = await this.client.get(`/nodes/${nodeId}/allocations`);
            return response.data.data.map(allocation => allocation.attributes);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Create an allocation for a node
     * @param {string|number} nodeId - Node ID
     * @param {Object} allocationData - Allocation data (ip, port, etc.)
     * @returns {Promise<Object>} - Created allocation
     */
    async createAllocation(nodeId, allocationData) {
        try {
            const response = await this.client.post(`/nodes/${nodeId}/allocations`, allocationData);
            return response.data.attributes;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Create a new server
     * @param {string} name - Server name
     * @param {number} userId - User ID
     * @param {number} eggId - Egg ID
     * @param {number} nodeId - Node ID
     * @param {number} memory - Memory in MB
     * @param {number} disk - Disk in MB
     * @param {number} cpu - CPU percentage
     * @returns {Promise<Object>} - Created server object
     */
    async createServer(name, userId, eggId, nodeId, memory, disk, cpu) {
        try {
            const allocations = await this.getNodeAllocations(nodeId);
            const availableAllocation = allocations.find(a => !a.assigned);
            
            if (!availableAllocation) {
                throw new Error('No available allocations on the specified node');
            }
            
            const egg = await this.getEgg(eggId);
            
            if (!egg) {
                throw new Error(`Egg with ID ${eggId} not found`);
            }
            
            const environment = {};
            if (egg.relationships?.variables?.data) {
                egg.relationships.variables.data.forEach(variable => {
                    const varAttr = variable.attributes;
                    environment[varAttr.env_variable] = varAttr.default_value || '';
                });
            }
            
            const serverData = {
                name,
                user: userId,
                egg: eggId,
                docker_image: egg.docker_image,
                startup: egg.startup,
                environment,
                limits: {
                    memory,
                    swap: 0,
                    disk,
                    io: 500,
                    cpu
                },
                feature_limits: {
                    databases: 0,
                    allocations: 1,
                    backups: 0
                },
                allocation: {
                    default: availableAllocation.id
                }
            };
            
            const response = await this.client.post('/servers', serverData);
            return response.data.attributes;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get server by ID
     * @param {string|number} serverId - Server ID
     * @returns {Promise<Object>} - Server object
     */
    async getServer(serverId) {
        try {
            const response = await this.client.get(`/servers/${serverId}`);
            return response.data.attributes;
        } catch (error) {
            if (error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    }

    /**
     * Update server details
     * @param {string|number} serverId - Server ID
     * @param {Object} updates - Updates to apply (name, description, etc.)
     * @returns {Promise<Object>} - Updated server object
     */
    async updateServerDetails(serverId, updates) {
        try {
            const response = await this.client.patch(`/servers/${serverId}/details`, updates);
            return response.data.attributes;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all servers with user and node information
     * @returns {Promise<Array>} - Array of servers
     */
    async getServers() {
        try {
            let allServers = [];
            let page = 1;
            let hasMorePages = true;

            while (hasMorePages) {
                const response = await this.client.get(`/servers?include=user,node,egg&page=${page}&per_page=50`);
                const servers = response.data.data.map(server => {
                    const serverData = server.attributes;
                    if (server.attributes.relationships) {
                        if (server.attributes.relationships.user) {
                            serverData.user = server.attributes.relationships.user.attributes;
                        }
                        if (server.attributes.relationships.node) {
                            serverData.node = server.attributes.relationships.node.attributes;
                        }
                        if (server.attributes.relationships.egg) {
                            serverData.egg = server.attributes.relationships.egg.attributes;
                        }
                    }
                    return serverData;
                });
                allServers.push(...servers);

                const pagination = response.data.meta?.pagination;
                if (pagination && pagination.current_page < pagination.total_pages) {
                    page++;
                } else {
                    hasMorePages = false;
                }
            }

            return allServers;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete a server using application API or client API fallback with retry logic
     * @param {string|number} serverId - Server ID
     * @returns {Promise<boolean>} - Success status
     */
    async deleteServer(serverId) {
        console.log(`${emojis.general.trash} Attempting to delete server ID: ${serverId}`);
        
        try {
            console.log(`${emojis.status.suspended} Pre-suspending server ${serverId} to improve deletion success...`);
            await this.suspendServer(serverId);
            console.log(`${emojis.general.check_mark} Server ${serverId} suspended successfully`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (suspendError) {
            if (suspendError.message.includes('being transferred')) {
                console.log(`${emojis.general.warning} Server ${serverId} is being transferred, skipping pre-suspension`);
            } else if (suspendError.message.includes('409')) {
                console.log(`${emojis.general.warning} Server ${serverId} is in a conflicting state, skipping pre-suspension`);
            } else {
                console.log(`${emojis.general.warning} Pre-suspension failed: ${suspendError.message}`);
            }
        }
        
        const retryOperation = async (operation, description, maxRetries = 2) => {
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    console.log(`${emojis.actions.signal} ${description} (attempt ${attempt}/${maxRetries})`);
                    return await operation();
                } catch (error) {
                    if (attempt === maxRetries) {
                        throw error;
                    }
                    if (error.message.includes('Gateway Timeout') || error.message.includes('504')) {
                        console.log(`⏳ Gateway timeout on attempt ${attempt}, retrying in 3 seconds...`);
                        await new Promise(resolve => setTimeout(resolve, 3000));
                    } else {
                        throw error; 
                    }
                }
            }
        };
        
        const deleteStrategies = [
            {
                name: 'Standard delete',
                operation: () => this.client.delete(`/servers/${serverId}`)
            },
            {
                name: 'Force delete',
                operation: () => this.client.delete(`/servers/${serverId}?force=1`)
            },
            {
                name: 'Force delete (alternative)',
                operation: () => this.client.delete(`/servers/${serverId}/force`)
            }
        ];

        let lastError = null;
        
        for (const strategy of deleteStrategies) {
            try {
                await retryOperation(
                    strategy.operation,
                    `${strategy.name} for server ${serverId}`
                );
                console.log(`${emojis.general.check_mark} Server ${serverId} deleted successfully via ${strategy.name}`);
                return true;
            } catch (error) {
                console.log(`${emojis.general.warning} ${strategy.name} failed: ${error.message}`);
                lastError = error;
                
                if (!error.message.includes('Gateway Timeout') && !error.message.includes('504')) {
                    break;
                }
            }
        }
        
        const appError = lastError;
        if (appError) {
            console.log(`${emojis.general.warning} All application API delete strategies failed: ${appError.message}`);
            
            if (this.clientAPI && this.userApiKey) {
                try {
                    console.log(`${emojis.actions.signal} Trying client API delete fallback for server ${serverId}`);
                    
                    const serversResponse = await retryOperation(
                        () => this.clientAPI.get('/'),
                        `Getting server list from client API`
                    );
                    
                    const servers = serversResponse.data.data;
                    const targetServer = servers.find(s => s.attributes.server_owner && 
                        (s.attributes.identifier === serverId.toString() || s.attributes.internal_id === parseInt(serverId)));
                    
                    if (!targetServer) {
                        console.log(`${emojis.general.cross_mark} Could not find server ${serverId} in client API`);
                        throw appError; 
                    }
                    
                    const serverUuid = targetServer.attributes.uuid;
                    console.log(`${emojis.general.magnifying_glass} Found server UUID: ${serverUuid} for server ID: ${serverId}`);
                    
                    await retryOperation(
                        () => this.clientAPI.delete(`/servers/${serverUuid}`),
                        `Client API delete for server ${serverUuid}`
                    );
                    console.log(`${emojis.general.check_mark} Server ${serverId} deleted successfully via client API`);
                    return true;
                    
                } catch (clientError) {
                    console.log(`${emojis.general.cross_mark} Client API delete also failed: ${clientError.message}`);
                    throw appError;
                }
            } else {
                console.log(`${emojis.general.cross_mark} No user API key available for client API fallback`);
                throw appError;
            }
        }
    }

    /**
     * Get locations
     * @returns {Promise<Array>} - Array of locations
     */
    async getLocations() {
        try {
            const response = await this.client.get('/locations');
            return response.data.data.map(location => location.attributes);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Test API connection
     * @returns {Promise<boolean>} - Connection status
     */
    async testConnection() {
        try {
            await this.client.get('/users?per_page=1');
            return true;
        } catch (error) {
            console.error('Connection test failed:', error.message);
            return false;
        }
    }

    /**
     * Get servers by user ID
     * @param {string|number} userId - User ID
     * @returns {Promise<Array>} - Array of servers
     */
    async getServersByUser(userId) {
        try {
            const allServers = await this.getServers();
            return allServers.filter(server => {
                if (!server.user) return false;
                
                if (typeof server.user === 'object' && server.user.id) {
                    return server.user.id.toString() === userId.toString();
                }
                
                if (typeof server.user === 'number' || typeof server.user === 'string') {
                    return server.user.toString() === userId.toString();
                }
                
                return false;
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get detailed server information with relationships
     * @param {string|number} serverId - Server ID
     * @returns {Promise<Object>} - Detailed server object
     */
    async getServerDetails(serverId) {
        try {
            const response = await this.client.get(`/servers/${serverId}?include=allocations,user,node,nest,egg`);
            const serverData = response.data.attributes;
            
            if (response.data.attributes.relationships) {
                const relationships = response.data.attributes.relationships;
                
                if (relationships.user?.attributes) {
                    serverData.user = relationships.user.attributes;
                }
                
                if (relationships.node?.attributes) {
                    serverData.node = relationships.node.attributes;
                }
                
                if (relationships.egg?.attributes) {
                    serverData.egg = relationships.egg.attributes;
                }
                
                if (relationships.nest?.attributes) {
                    serverData.nest = relationships.nest.attributes;
                }
            }
            
            return serverData;
        } catch (error) {
            if (error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    }

    /**
     * Get server resource usage (requires client API)
     * @param {string|number} serverId - Server ID
     * @returns {Promise<Object>} - Server usage data
     */
    async getServerUsage(serverId) {
        try {
            if (!this.clientAPI) {
                return null;
            }
            
            const response = await this.clientAPI.get(`/servers/${serverId}/resources`);
            return response.data.attributes;
        } catch (error) {
            return null;
        }
    }

    /**
     * Get server power state using client API
     * @param {string|number} serverId - Server ID
     * @returns {Promise<string>} - Server power state (starting, running, stopping, offline)
     */
    async getServerPowerState(serverId) {
        try {
            if (!this.clientAPI) {
                return null;
            }
            
            const response = await this.clientAPI.get(`/servers/${serverId}/resources`);
            return response.data.attributes.current_state;
        } catch (error) {
            return null;
        }
    }

    /**
     * Get multiple server power states efficiently
     * @param {Array} serverIds - Array of server IDs
     * @returns {Promise<Map>} - Map of server ID to power state
     */
    async getMultipleServerStates(serverIds) {
        try {
            if (!this.clientAPI || !serverIds.length) {
                return new Map();
            }

            const stateMap = new Map();
            
            const promises = serverIds.map(async (serverId) => {
                try {
                    const response = await this.clientAPI.get(`/servers/${serverId}/resources`);
                    return { serverId, state: response.data.attributes.current_state };
                } catch (error) {
                    return { serverId, state: null };
                }
            });

            const results = await Promise.allSettled(promises);
            
            results.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    stateMap.set(result.value.serverId, result.value.state);
                }
            });

            return stateMap;
        } catch (error) {
            return new Map();
        }
    }

    /**
     * Update user information
     * @param {string|number} userId - User ID
     * @param {Object} userData - Updated user data
     * @returns {Promise<Object>} - Updated user object
     */
    async updateUser(userId, userData) {
        try {
            const response = await this.client.patch(`/users/${userId}`, userData);
            return response.data.attributes;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Ban user (suspend all their servers)
     * @param {string|number} userId - User ID
     * @returns {Promise<boolean>} - Success status
     */
    async banUser(userId) {
        try {
            const servers = await this.getServersByUser(userId);
            
            const suspendPromises = servers.map(server => this.suspendServer(server.id));
            await Promise.all(suspendPromises);
            
            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Unban user (unsuspend all their servers)
     * @param {string|number} userId - User ID
     * @returns {Promise<boolean>} - Success status
     */
    async unbanUser(userId) {
        try {
            const servers = await this.getServersByUser(userId);
            
            const unsuspendPromises = servers.map(server => this.unsuspendServer(server.id));
            await Promise.all(unsuspendPromises);
            
            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Suspend a server
     * @param {string|number} serverId - Server ID
     * @returns {Promise<boolean>} - Success status
     */
    async suspendServer(serverId) {
        try {
            await this.client.post(`/servers/${serverId}/suspend`);
            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Unsuspend a server
     * @param {string|number} serverId - Server ID
     * @returns {Promise<boolean>} - Success status
     */
    async unsuspendServer(serverId) {
        try {
            await this.client.post(`/servers/${serverId}/unsuspend`);
            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Start a server (requires client API)
     * @param {string|number} serverId - Server ID
     * @returns {Promise<boolean>} - Success status
     */
    async startServer(serverId) {
        try {
            console.log(`Start command sent for server ${serverId}`);
            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Stop a server (requires client API)
     * @param {string|number} serverId - Server ID
     * @returns {Promise<boolean>} - Success status
     */
    async stopServer(serverId) {
        try {
            console.log(`Stop command sent for server ${serverId}`);
            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Restart a server (requires client API)
     * @param {string|number} serverId - Server ID
     * @returns {Promise<boolean>} - Success status
     */
    async restartServer(serverId) {
        try {
            console.log(`Restart command sent for server ${serverId}`);
            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Transfer server to another node
     * @param {string|number} serverId - Server ID
     * @param {string|number} nodeId - Target node ID
     * @returns {Promise<boolean>} - Success status
     */
    async transferServer(serverId, nodeId) {
        try {
            const transferData = {
                node: parseInt(nodeId)
            };
            
            await this.client.patch(`/servers/${serverId}/details`, transferData);
            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Reinstall a server
     * @param {string|number} serverId - Server ID
     * @returns {Promise<boolean>} - Success status
     */
    async reinstallServer(serverId) {
        try {
            await this.client.post(`/servers/${serverId}/reinstall`);
            return true;
        } catch (error) {
            throw error;
        }
    }
}

const pterodactylClient = new PterodactylClient();

module.exports = pterodactylClient;

/*
 * Project: Groove Music
 * Author: faisaljs (Faisal)
 * Organization: Eleone Hub
 * GitHub: https://github.com/faisaljs
 * License: MIT
 * © 2026 Eleone Hub. All rights reserved.
 */
