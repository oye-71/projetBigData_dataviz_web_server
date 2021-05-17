const { MongoClient } = require("mongodb");
const AWS = require('aws-sdk');
const csv = require('csv-parser');

// Constantes connexion mongodb
const connexionUri = "mongodb://127.0.0.1:27017/"
const client = new MongoClient(connexionUri);

// Constante connexion bucket S3
const s3 = new AWS.S3({
    'region': 'us-east-1'
});

// Infos bucket S3
let bucket = "projectbigdata-outputdata";
var paramsPredict = {
    Bucket: bucket + "/big_data_project",
    Key: "predict.csv",
};
var paramsWordCloud = {
    Bucket: bucket + "/big_data_project",
    Key: "cloud_word.csv",
}
var paramsWordCloudGender = {
    Bucket: bucket + "/big_data_project",
    Key: "cloud_word_gender.csv",
}

/**
 * Importe les données des fichiers predict.csv, cloud_word.csv et cloud_word_gender.csv sur Mongo en local.
 * @returns {Promise<String>} Message de réussite à la fin du process.
 */
async function s3ToMongo() {
    try {
        // Connexion au serveur mongo
        await client.connect();

        // Connexion à la collection souhaitée
        let collectionP = client.db("projetBigData").collection("predict");
        let collectionW = client.db("projetBigData").collection("wordCloud");
        let collectionWG = client.db("projetBigData").collection("wordCloudGender");
        let collectionF = client.db("projetBigData").collection("dateFlag");

        let currentDate = new Date();
        let dateFlag = currentDate.toISOString().split(':')[0] + ":" + currentDate.toISOString().split(':')[1];

        // Récupération du flag de date s'il existe
        let ancientDateFlag = await collectionF.findOne({}, {});

        // Récupération des infos des objets
        let predictInfo = await s3.headObject(paramsPredict).promise();
        let predictTimeCondition = ancientDateFlag == null || predictInfo.LastModified > new Date(ancientDateFlag.date);
        let wordcloudInfo = await s3.headObject(paramsWordCloud).promise();
        let wordcloudTimeCondition = ancientDateFlag == null || wordcloudInfo.LastModified > new Date(ancientDateFlag.date);
        let wordcloudgenderInfo = await s3.headObject(paramsWordCloudGender).promise();
        let wordcloudgenderTimeCondition = ancientDateFlag == null || wordcloudgenderInfo.LastModified > new Date(ancientDateFlag.date);

        // Si le fichier wordcloud sur s3 est plus vieux que le flag on ne fait rien
        if (wordcloudTimeCondition) {
            // Read du fichier wordcloud situé le bucket s3, et ajout des données dans la collection mongo
            let s3csvWordClouds = s3.getObject(paramsWordCloud).createReadStream();

            let totalCount = 0;
            for await (let data of s3csvWordClouds.pipe(csv())) {
                // Chaque ligne de CSV est lue et stockée en Json, avec date de recup
                data.date = dateFlag;

                // Insert or update
                const query = { metier: data.metier };
                const update = { $set: data };
                const options = { upsert: true };
                let inserted = await collectionW.updateOne(query, update, options);

                if (inserted) {
                    totalCount++;
                    process.stdout.write("Retrieving from s3... " + totalCount + " wordcloud objects already inserted/updated.\r");
                }
            }
            console.log("\nTotal of " + totalCount + " wordcloud objects inserted/updated.");
        } else {
            console.log("No wordcloud file to add on mongo. Database is already up to date.");
        }

        if (wordcloudgenderTimeCondition) {
            // Read du fichier predict situé le bucket s3, et ajout des données dans la collection mongo
            let s3csvWordCloudGenders = s3.getObject(paramsWordCloudGender).createReadStream();

            let totalCount = 0;
            for await (let data of s3csvWordCloudGenders.pipe(csv())) {
                // Chaque ligne de CSV est lue et stockée en Json, avec date de recup
                data.date = dateFlag;

                // Insert or update
                const query = { metier: data.metier, gender: data.gender };
                const update = { $set: data };
                const options = { upsert: true };
                let inserted = await collectionWG.updateOne(query, update, options);

                if (inserted) {
                    totalCount++;
                    process.stdout.write("Retrieving from s3... " + totalCount + " wordcloudgender objects already inserted/updated.\r");
                }
            }
            console.log("\nTotal of " + totalCount + " wordcloudgender objects inserted/updated.");
        } else {
            console.log("No wordcloudgender file to add on mongo. Database is already up to date.");
        }

        // Si le fichier predict sur s3 est plus vieux que le flag on ne fait rien
        if (predictTimeCondition) {
            // Read du fichier predict situé le bucket s3, et ajout des données dans la collection mongo
            let s3csvPredicts = s3.getObject(paramsPredict).createReadStream();

            // Récupération du dernier id cv pour n'insérer que les plus récents (performance)
            // Faire un insertOrUpdate prendrait beaucoup trop de temps au vu du nombre de lignes de predict.csv
            let latestCVQuery = collectionP.find().sort({ id_cv: -1 }).limit(1);
            let latestCV = -1;
            if (await latestCVQuery.count() > 0)
                latestCV = (await latestCVQuery.toArray())[0].id_cv;

            let totalCount = 0;
            // Chaque ligne de CSV est lue et stockée en Json, avec date de recup
            for await (let data of s3csvPredicts.pipe(csv())) {
                data.id_cv = parseInt(data.id_cv);

                if (data.id_cv > latestCV) {
                    data.date = dateFlag;
                    if (await collectionP.insertOne(data)) {
                        totalCount++;
                        if (totalCount % 20 == 0) // Sinon trop de logs
                            process.stdout.write("Retrieving from s3... " + totalCount + " predict objects already inserted.\r");
                    }
                } else {
                    process.stdout.write("Ignoring CV with id=" + data.id_cv + " because it already exists in mongo.\r");
                }
            }

            console.log("\nTotal of " + totalCount + " predict objects inserted.");
        } else {
            console.log("No predict file to add on mongo. Database is already up to date.");
        }

        // Ajout ou update du nouveau flag dans Mongo
        let filter;
        if (ancientDateFlag != null)
            filter = { _id: ancientDateFlag._id };

        let updatedDateFlag = {
            $set: {
                date: dateFlag,
            },
        };
        if (ancientDateFlag == null) {
            if (await collectionF.insertOne({ date: dateFlag })) {
                console.log("[Object : DateFlag] successfuly inserted.");
            }
        } else {
            if (await collectionF.updateOne(filter, updatedDateFlag)) {
                console.log("[Object : DateFlag] successfuly updated.");
            }
        }

        // Messages de confirmation finale
        if (!predictTimeCondition && !wordcloudTimeCondition && !wordcloudgenderTimeCondition)
            return "Mongo is already up to date. No data has been imported.";
        return "S3 data successfuly sent to mongo.";
    } catch (e) {
        console.error("An error occured : ");
        console.error(e);
        throw e;
    }
}

/**
 * Récupère le plus grand id CV existant en base
 * @returns {Promise<Number>} L'id CV le plus grand existant en base
 */
async function getDataVizCVMaxId() {
    try {
        // Connexion au serveur mongo
        await client.connect();

        // Connexion à la collection predict
        let collectionP = client.db("projetBigData").collection("predict");

        // Query
        let latestCVQuery = collectionP.find().sort({ id_cv: -1 }).limit(1);
        let latestCV = -1;
        if (await latestCVQuery.count() > 0)
            latestCV = (await latestCVQuery.toArray())[0].id_cv;
        return latestCV;
    } catch (e) {
        console.error("An error occured : ");
        console.error(e);
        throw e;
    }
}

/**
 * Récupère le predict pour un CV
 * @param {Number} id_cv_param Id du CV ciblé 
 * @returns {Promise<Object>} Document predict du CV ciblé
 */
async function getDataVizCV(id_cv_param) {
    try {
        // Connexion au serveur mongo
        await client.connect();

        // Connexion à la collection predict
        let collectionP = client.db("projetBigData").collection("predict");

        // Query
        return await collectionP.findOne({ id_cv: id_cv_param });
    } catch (e) {
        console.error("An error occured : ");
        console.error(e);
        throw e;
    }
}

/**
 * Récupère la liste des métiers prédits
 * @returns {Promise<Array>} Liste des métiers 
 */
async function getDataVizJobList() {
    try {
        // Connexion au serveur mongo
        await client.connect();

        // Connexion à la collection predict
        let collectionW = client.db("projetBigData").collection("wordCloud");

        // Query
        return await collectionW.find({}, { projection: { _id: 0, metier: 1 } }).toArray();
    } catch (e) {
        console.error("An error occured : ");
        console.error(e);
        throw e;
    }
}

async function getDataVizJobs(job) {
    try {
        // Connexion au serveur mongo
        await client.connect();

        // Connexion à la collection predict
        let collectionW = client.db("projetBigData").collection("wordCloud");
        let collectionWG = client.db("projetBigData").collection("wordCloudGender");

        // TODO query by job 
        // TODO voir comment gérer le gender
    } catch (e) {
        console.error("An error occured : ");
        console.error(e);
        throw e;
    }
}

module.exports = {
    s3ToMongo: s3ToMongo,
    getDataVizCVMaxId: getDataVizCVMaxId,
    getDataVizCV: getDataVizCV,
    getDataVizJobList: getDataVizJobList,
    getDataVizJobs: getDataVizJobs
}