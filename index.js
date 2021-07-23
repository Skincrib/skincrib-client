const io = require('socket.io-client');
const assert = require('assert');
const EventEmitter = require('events').EventEmitter;

const SKINCRIB_URL = 'https://skincrib.com';

const socket = io(SKINCRIB_URL, {
    transports: ['websocket'],
    upgrade: false
});

module.exports = class SkincribClient extends EventEmitter{
    constructor({ key, reconnect } = {key: null, reconnect: true}){
        super();
        assert(key, '"key" parameter must be included to connect to Skincrib.');
        assert(typeof reconnect == 'boolean', '"reconnect" parameter must be a boolean.');
        this.connected();

        this.key = key; //api key
        this.reconnect = reconnect;
        this.authenticated = false;

        socket.on('connect', ()=>this.connected);
        socket.on('disconnect', ()=>this.disconnected);
        socket.on('error', ()=>this.error);

        socket.on('p2p:listings:new', (listing)=>this.emit('listing.added', listing));
        socket.on('p2p:listings:removed', ({id})=>this.emit('listing.removed', id));
        socket.on('p2p:listings:status', (listing)=>this.emit('listing.status', listing));
    }

    connected(){
        return this.emit('connected', 'Connected to Skincrib websocket server.');
    }
    disconnected(){
        this.authenticated = false;
        if(this.reconnect) this.authenticate();
        return this.emit('disconnected', 'Disconnected from Skincrib websocket server.');
    }
    error(error){
        if(error.message) return this.emit('error', error.message);
        this.emit('error', error);
    }

    //authenticate to api
    authenticate(){
        return new Promise((res, rej)=>{
            socket.emit('authenticate', {key: this.key}, (err, data)=>{
                if(err){
                    return rej(err.message);
                }
                this.authenticated = true;
                this.emit('authenticated', 'Connected to skincrib websocket server.');
                return res(data.data);
            });
        });
    }

    //load csgo inventory
    loadInventory(){
        return new Promise((res, rej)=>{
            assert(this.authenticated, 'You must authenticate to the websocket first.');

            socket.emit('user:loadInventory', {}, (err, data)=>{
                if(err){
                    return rej(err.message);
                }
                return res(data.data.inventory);
            });
        });
    }

    //save api key
    setApiKey(apiKey){
        return new Promise((res, rej)=>{
            assert(this.authenticated, 'You must authenticate to the websocket first.');
            assert(key, 'You must include a Steam API KEY to set.');

            socket.emit('user:updateSettings:apiKey', {apiKey}, (err, data)=>{
                if(err){
                    return rej(err.message);
                }
                return res(data.message);
            });
        });
    }
    //save trade url
    setTradeUrl(tradeUrl){
        return new Promise((res, rej)=>{
            assert(this.authenticated, 'You must authenticate to the websocket first.');
            assert(tradeUrl, 'You must include a Steam trade URL to set.');

            socket.emit('user:updateSettings:tradeUrl', {tradeUrl}, (err, data)=>{
                if(err){
                    return rej(err.message);
                }
                return res(data.message);
            });
        });
    }

    //get active listings
    getActiveListings(){
        return new Promise((res, rej)=>{
            assert(this.authenticated, 'You must authenticate to the websocket first.');

            socket.emit('p2p:listings:active', {}, (err, data)=>{
                if(err){
                    return rej(err.message);
                }
                return res(data.data);
            });
        });
    }

    //create listings
    createListings(items){
        return new Promise((res, rej)=>{
            assert(this.authenticated, 'You must authenticate to the websocket first.');
            assert((items && Array.isArray(items) && items.length > 0), 'You must include an array of at least one item to create listings.');
            //verify items are valid
            items.forEach(item=>{
                assert(item.assetid, `Item index: ${items.indexOf(item)} must include an assetid.`);
                assert(item.price, `Item index: ${items.indexOf(item)} must include a price.`);
                assert(item.percentIncrease, `Item index: ${items.indexOf(item)} must include a percentIncrease.`);
            });

            socket.emit('p2p:listings:new', {items}, (err, data)=>{
                if(err?.message){
                    return rej(err.message);
                }
                return res(data.data);
            });
        });
    }

    //cancel listings
    cancelListings(ids){
        return new Promise((res, rej)=>{
            assert(this.authenticated, 'You must authenticate to the websocket first.');
            assert((ids && Array.isArray(ids) && ids.length > 0), 'You must include an array of at least one listing id to cancel.');

            socket.emit('p2p:listings:cancel', {ids}, (err, data)=>{
                if(err){
                    return rej(err.message);
                }
                return res(data.data);
            });
        });
    }

    //purchase listing
    purchaseListing(id){
        return new Promise((res, rej)=>{
            assert(this.authenticated, 'You must authenticate to the websocket first.');
            assert(id, 'You must include a listing id to purchase.');

            socket.emit('p2p:listings:purchase', {id}, (err, data)=>{
                if(err){
                    return rej(err.message);
                }
                return res(data.data);
            });
        });
    }

    //confirm listing
    confirmListing(id){
        return new Promise((res, rej)=>{
            assert(this.authenticated, 'You must authenticate to the websocket first.');
            assert(id, 'You must include a listing id to confirm.');

            socket.emit('p2p:listings:confirm', {id}, (err, data)=>{
                if(err){
                    return rej(err.message);
                }
                return res(data.data);
            });
        });
    }
}