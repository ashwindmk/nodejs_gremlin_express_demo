const express = require('express');
const gremlin = require('gremlin');
const bodyParser = require('body-parser');

const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection;
const GREMLIN_HOST = "ws://localhost:8182/gremlin";
const connection = new DriverRemoteConnection(GREMLIN_HOST);
const Graph = gremlin.structure.Graph;
const graph = new Graph();
const g = graph.traversal().withRemote(connection);

const app = express();

app.use(bodyParser.json());

// add person
app.post('/persons/add', (req, res) => {
    const body = req.body;
    if (body) {
        const name = body['name'];
        const age = body['age'];
        g.V().hasLabel('person').has('name', name).next()
            .then((result) => {
                if (result && result['value']) {
                    res.status(400).send('Person already exists');
                } else {
                    g.addV('person').property('name', name).property('age', age).next()
                        .then((result) => {
                            res.status(201).json(result);
                        })
                        .catch((err) => {
                            res.status(500).json(err);
                        });
                }
            })
            .catch((err) => {
                res.status(500).json(err);
            });
    } else {
        res.status(400).send('Request should contain body');
    }
});

// add software
app.post('/softwares/add', (req, res) => {
    const body = req.body;
    if (body) {
        const name = body['name'];
        const lang = body['lang'];
        g.V().hasLabel('software').has('name', name).next()
            .then((result) => {
                if (result && result['value']) {
                    res.status(400).send('Software already exists');
                } else {
                    g.addV('software').property('name', name).property('lang', lang).next()
                        .then((result) => {
                            res.status(201).json(result);
                        })
                        .catch((err) => {
                            res.status(500).json(err);
                        });
                }
            })
            .catch((err) => {
                res.status(500).json(err);
            });
    } else {
        return res.status(400).send('Request should contain body');
    }
});

app.post('/edges/add', (req, res) => {
    const body = req.body;
    if (body) {
        const person = body['person'];
        const software = body['software'];
        const weight = body['weight'];
        g.V().has('person', 'name', person).next()
            .then((v1) => {
                const v1id = v1['value']['id'];
                g.V().has('software', 'name', software).next()
                    .then((v2) => {
                        const v2id = v2['value']['id'];
                        if (v1id && v2id) {
                            g.V(v1id).addE('created').to(g.V(v2id)).property('weight', weight).next()
                                .then((result) => {
                                    res.status(201).json(result);
                                })
                                .catch((err) => {
                                    res.status(500).json(err);
                                });
                        } else {
                            res.status(400).send('Invalid person or software');
                        }
                    })
                    .catch((err) => {
                        res.status(500).json({
                            "error": err,
                            "message": "Error getting software " + software + " vertex"
                        });
                    });
            })
            .catch((err) => {
                res.status(500).json({
                    "error": err,
                    "message": "Error getting person " + person + " vertex"
                });
            });
    } else {
        return res.status(400).send('Request should contain body');
    }
});

// get all persons
app.get('/persons/all', (req, res) => {
    g.V().hasLabel('person').values('name').toList()
        .then((results) => {
            console.log('Persons: ' + JSON.stringify(results));
            res.json(results);
        })
        .catch((err) => {
            console.error(JSON.stringify(err));
            res.status(500).send('Server Error :(');
        });
});

// get persons who developed software
app.get('/persons/:software', (req, res) => {
    const software = req.params.software;
    g.V().has('software', 'name', software).in_('created').values('name').toList()
        .then((results) => {
            res.json(results);
        })
        .catch((err) => {
            res.status(500).json(err);
        });
});

// get all softwares
app.get('/softwares/all', (req, res) => {
    g.V().hasLabel('software').values('name').toList()
        .then((results) => {
            console.log('Softwares: ' + JSON.stringify(results));
            res.json(results);
        })
        .catch((err) => {
            console.error(JSON.stringify(err));
            res.status(500).send('Server Error :(');
        });
});

// get softwares developed by person
app.get('/softwares/:person', (req, res) => {
    const person = req.params.person;
    g.V().has('person', 'name', person).out('created').values('name').toList()
        .then((results) => {
            res.json(results);
        })
        .catch((err) => {
            res.status(500).json(err);
        });
});

// get all edges
app.get('/edges', (req, res) => {
    g.E().toList()
        .then((results) => {
            console.log('Edges: ' + JSON.stringify(results));
            res.json(results);
        })
        .catch((err) => {
            res.status(500).send('Server Error :(');
        });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
