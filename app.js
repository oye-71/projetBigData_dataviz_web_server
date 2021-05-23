const CONFIG = require('./config.json')
const mongoService = require('./mongoService');
const cp = require('child_process');
const express = require('express');
const favicon = require('serve-favicon');

// Lance une instance de mongo en local
cp.exec(`${CONFIG.mongoDPath}`, (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
});

// Instancie le middleware express
const app = express();
// Importe tous les fichiers statiques situés sur /src et sur /public
app.use('/src', express.static(__dirname + '/src'));
app.use('/public', express.static(__dirname + '/public'));
// Définit la favicon de toutes les pages servies
app.use(favicon(__dirname + '/public/favicon.ico'));

// Affiche la page html de base
app.get('/', (req, res) => {
    res.sendFile('./src/index.html', { root: __dirname },
        (err) => {
            if (err) console.error(err);
            else console.log("index.html rendered");
        });
});

// Transfère les résultats du cloud à Mongo
app.get('/mongo', async(req, res) => {
    try {
        result = await mongoService.s3ToMongo();
        res.send(result);
    } catch (e) {
        console.error(e);
        res.status(500).send('Une erreur est survenue lors de l\'import des données de AWS à mongo. Pour plus de détails, vérifier les logs du serveur.');
    }
});

// Fait en sorte d'afficher la page de data viz
app.get('/viz', async(req, res) => {
    res.sendFile('./src/dataviz.html', { root: __dirname },
        (err) => {
            if (err) console.error(err);
            else console.log("dataviz.html rendered");
        });
});

// Récupère l'id_cv le plus grand en base, -1 sinon
app.get('/viz/id_cv', async(req, res) => {
    try {
        result = await mongoService.getDataVizCVMaxId();
        res.send(JSON.stringify(result));
    } catch (e) {
        res.status(500).send('Une erreur est survenue lors de l\'extraction de l\'id_cv maximum sur mongo. Pour plus de détails, vérifier les logs du serveur.');
    }
});

// Récupère les données mongo pour un cv
app.get('/viz/id_cv/:idcvParam', async(req, res) => {
    try {
        result = await mongoService.getDataVizCV(parseInt(req.params.idcvParam));
        res.send(JSON.stringify(result));
    } catch (e) {
        res.status(500).send('Une erreur est survenue lors de l\'extraction des données pour un CV donné. Pour plus de détails, vérifier les logs du serveur.');
    }
});

// Récupère les données mongo pour la liste des métiers 
app.get('/viz/metiers', async(req, res) => {
    try {
        result = await mongoService.getDataVizJobList();
        res.send(JSON.stringify(result));
    } catch (e) {
        res.status(500).send('Une erreur est survenue lors de l\'extraction de la liste des métiers sur mongo. Pour plus de détails, vérifier les logs du serveur.');
    }
});

// Récupère les données mongo pour restituer wordclouds genrés et non genrés
app.get('/viz/metiers/:metierParam', async(req, res) => {
    try {
        result = await mongoService.getDataVizJobs(req.params.metierParam);
        res.send(JSON.stringify(result));
    } catch (e) {
        res.status(500).send('Une erreur est survenue lors de l\'extraction des données pour un métier sur mongo. Pour plus de détails, vérifier les logs du serveur.');
    }
});

// Lance le serveur
app.listen(3000, () => {
    console.log('App launched on port 3000.');
}).setTimeout(6000000); // 100 min de timeout pour laisser le (long) import se terminer en toutes circonstances