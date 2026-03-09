const fs = require('fs');
const dns = require('dns').promises;
dns.setServers(['8.8.8.8']);
(async () => {
    try {
        const srv = await dns.resolveSrv('_mongodb._tcp.cluster0.quurzyz.mongodb.net');
        const txt = await dns.resolveTxt('cluster0.quurzyz.mongodb.net');
        fs.writeFileSync('dns_result.json', JSON.stringify({ srv, txt }, null, 2));
    } catch (e) { console.error(e); }
})();
