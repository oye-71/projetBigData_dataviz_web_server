/* TODO Etiene ajouter ici dans la config des variables liées à Aws Et mongo pour tout paramétrer */
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
// Importe tous les fichiers statiques situés sur /src
app.use('/src', express.static(__dirname + '/src'));
// // Définit la favicon de toutes les pages servies
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
        res.status(500).send('An error occured while retrieving data from s3 to mongo. Please see server logs for more details.');
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
        res.status(500).send('An error occured while getting max CV id on mongo. Please see server logs for more details.');
    }
});

// Récupère les données mongo pour un cv
app.get('/viz/id_cv/:idcvParam', async(req, res) => {
    try {
        result = await mongoService.getDataVizCV(parseInt(req.params.idcvParam));
        res.send(JSON.stringify(result));
    } catch (e) {
        res.status(500).send('An error occured while extracting data in mongo for a specific CV. Please see server logs for more details.');
    }
});

// Récupère les données mongo pour la liste des métiers 
app.get('/viz/metiers_list', async(req, res) => {
    try {
        result = await mongoService.getDataVizJobList();
        res.send(JSON.stringify(result));
    } catch (e) {
        res.status(500).send('An error occured while extracting data in mongo for the jobs list. Please see server logs for more details.');
    }
});

// Récupère les données mongo pour TODO def avec vic et gab : 1 metier, tous les metiers ... ?
app.get('/viz/metiers', async(req, res) => {
    try {
        result = await mongoService.getDataVizJobs(); // TODO
        res.send(result);
    } catch (e) {
        res.status(500).send('An error occured while extracting data in mongo for the jobs. Please see server logs for more details.');
    }
});

// Lance le serveur
app.listen(3000, () => {
    console.log('App launched on port 3000.');
}).setTimeout(6000000); // 100 min de timeout pour laisser le (long) import se terminer