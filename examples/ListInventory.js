const Skincrib = require('../../src/index.js');

const market = new Skincrib({
    key: 'YOUR SKINCRIB KEY',
    reconnect: true
});

const PERCENT_INCREASE = 15; // items will be listed 15% above their base price.

market.on('authenticated', (message) => {
    console.log(message);

    market.loadInventory()
    .then((inventory) => {
        //only list items that are able to be listed.
        const items = inventory.filter(item => {
            return item.accepted && item.tradable;
        });

        //add a key to each item that defines the percent increase.
        items.forEach(item => {
            item.percentIncrease = PERCENT_INCREASE;
        });

        //list the items.
        market.createListings(items)
        .then((listings) => {
            //show the listings.
            listings.forEach(listing => {
                console.log('Created Listing: ', listing);
            });
        }, (err) => {
            console.error(err);
        });
    }, (err) => {
        console.error(err);
    });
});

market.authenticate();