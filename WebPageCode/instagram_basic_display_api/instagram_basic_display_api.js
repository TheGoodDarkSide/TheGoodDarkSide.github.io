class InstagramBasicDisplayApi {
    constructor(params) {
        this._appId = '808510217872665';
        this._appSecret = '24d857087673311ac6720adb1b7ab27a';
        this._redirectUrl = 'https://thegooddarkside.github.io/WebPageCode/instagram_basic_display_api/';
        this._getCode = '';
        this._apiBaseUrl = 'https://api.instagram.com/';
        this._graphBaseUrl = 'https://graph.instagram.com/';
        this._userAccessToken = '';
        this._userAccessTokenExpires = '';
        this.authorizationUrl = '';
        this.hasUserAccessToken = false;
        this.userId = '';

        // save instagram code
        this._getCode = params['get_code'];

        // get an access token
        this._setUserInstagramAccessToken(params);

        // get authorization url
        this._setAuthorizationUrl();
    }

    getUserAccessToken() {
        return this._userAccessToken;
    }

    getUserAccessTokenExpires() {
        return this._userAccessTokenExpires;
    }

    _setAuthorizationUrl() {
        const getVars = {
            'app_id': this._appId,
            'redirect_uri': this._redirectUrl,
            'scope': 'user_profile,user_media',
            'response_type': 'code'
        };

        // create url
        this.authorizationUrl = this._apiBaseUrl + 'oauth/authorize?' + new URLSearchParams(getVars);
    }

    _setUserInstagramAccessToken(params) {
        if (params['access_token']) { // we have an access token
            this._userAccessToken = params['access_token'];
            this.hasUserAccessToken = true;
            this.userId = params['user_id'];
        } else if (params['get_code']) { // try and get an access token
            const userAccessTokenResponse = this._getUserAccessToken();
            this._userAccessToken = userAccessTokenResponse['access_token'];
            this.hasUserAccessToken = true;
            this.userId = userAccessTokenResponse['user_id'];

            // get long lived access token
            const longLivedAccessTokenResponse = this._getLongLivedUserAccessToken();
            this._userAccessToken = longLivedAccessTokenResponse['access_token'];
            this._userAccessTokenExpires = longLivedAccessTokenResponse['expires_in'];
        }
    }

    async _getUserAccessToken() {
        const response = await fetch(this._apiBaseUrl + 'oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: new URLSearchParams({
                'app_id': this._appId,
                'app_secret': this._appSecret,
                'grant_type': 'authorization_code',
                'redirect_uri': this._redirectUrl,
                'code': this._getCode
            })
        });

        return await response.json();
    }

    async _getLongLivedUserAccessToken() {
        const response = await fetch(this._graphBaseUrl + 'access_token?client_secret=' + this._appSecret + '&grant_type=ig_exchange_token');

        return await response.json();
    }

    async getUser() {
        const response = await this._makeApiCall({
            'endpoint_url': this._graphBaseUrl + 'me',
            'type': 'GET',
            'url_params': {
                'fields': 'id,username,media_count,account_type'
            }
        });

        return response;
    }

    async getUsersMedia() {
        const response = await this._makeApiCall({
            'endpoint_url': this._graphBaseUrl + this.userId + '/media',
            'type': 'GET',
            'url_params': {
                'fields': 'id,caption,media_type,media_url'
            }
        });

        return response;
    }

    async getPaging(pagingEndpoint) {
        const response = await this._makeApiCall({
            'endpoint_url': pagingEndpoint,
            'type': 'GET',
            'url_params': {
                'paging': true
            }
        });

        return response;
    }

    async getMedia(mediaId) {
        const response = await this._makeApiCall({
            'endpoint_url': this._graphBaseUrl + mediaId,
            'type': 'GET',
            'url_params': {
                'fields': 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username'
            }
        });

        return response;
    }

    async getMediaChildren(mediaId) {
        const response = await this._makeApiCall({
            'endpoint_url': this._graphBaseUrl + mediaId + '/children',
            'type': 'GET',
            'url_params': {
                'fields': 'id,media_type,media_url,permalink,thumbnail_url,timestamp,username'
            }
        });

        return response;
    }

    async _makeApiCall(params) {
        const endpoint = params['endpoint_url'];

        let url;
        let options = {
            'method': params['type'],
            'headers': {}
        };

        if (params['type'] === 'POST') {
            options.headers['Content-Type'] = 'application/json';
            options.body = new URLSearchParams(params['url_params']);
        } else if (params['type'] === 'GET' && !params['url_params']['paging']) {
            params['url_params']['access_token'] = this._userAccessToken;
            url = new URL(endpoint);
            url.search = new URLSearchParams(params['url_params']);
        }

        const response = await fetch(url || endpoint, options);
        const responseData = await response.json();

        if (responseData.error_type) {
            console.error(responseData);
            throw new Error('API call failed: ' + responseData.error_message);
        }

        return responseData;
    }
}
