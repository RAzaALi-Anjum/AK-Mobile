const mongoose = require('mongoose');
const Invoice = require('./models/Invoice');

mongoose.connect('mongodb://raza:raza@ac-tv6rnm0-shard-00-00.quurzyz.mongodb.net:27017,ac-tv6rnm0-shard-00-01.quurzyz.mongodb.net:27017,ac-tv6rnm0-shard-00-02.quurzyz.mongodb.net:27017/AkMobile?ssl=true&authSource=admin&replicaSet=atlas-10izdc-shard-0&retryWrites=true&w=majority')
    .then(async () => {
        try {
            await Invoice.deleteMany({ invoiceNumber: { $exists: false } });
            console.log('Cleaned old test invoices');
        } catch (e) { console.error(e); }
        process.exit(0);
    });
