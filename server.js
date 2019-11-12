let express = require('express');
let morgan = require('morgan');
let bp = require('body-parser');
//To use mongoose
let mongoose = require('mongoose');
let {PetList} = require('./model');

let {DATABASE_URL, PORT} = require('./config');

mongoose.Promise = global.Promise;

let app = express();
let jsonParser = bp.json();

app.use(express.static('public'));
app.use(morgan('dev'));

let nameOfPets = [
	{
		id: 1,
		name: "Burbuja",
		type: "Dog"
	},
	{
		id: 2,
		name: "Kia",
		type: "Dog"
	},
	{
		id: 3,
		name: "Jagger",
		type: "Dog"
	},
	{
		id: 4,
		name: "Kirby",
		type: "Dog"
	},
	{
		id: 5,
		name: "Daisy",
		type: "Dog"
	}
];

function getByID(ID)
{
	//Get a filtered list
	let fList = petList.filter(function(Pet) {
		return Pet.id == ID;
	})

	//Return the object or null
	if (fList.length > 0)
	{
		console.log(fList[0]);
		return fList[0];
	}
	else
	{
		return null;
	}
}

app.get('/api/pets', (req, res, next) => {
	PetList.get()
		.then(pets => {
			return res.status(200).json(pets);
		})
		.catch(error => {
			res.statusMessage = "Something went wrong with the DB. Try again later.";
			return res.status(500).json({
				status : 500,
				message : "Something went wrong with the DB. Try again later."
			})
		});
});

//Return an specific pet by ID
app.get('/api/getById', (req, res, next) => {
	//Check if the request include the ID parameter 
	if (!req.query.id)
	{
		res.statusMessage = "Missing ID param";
		return res.status(406).json({
			message : "Missing ID param"
		});
	}

	//Get the requested pet or null if the ID does not exist
	let petByID = getByID(req.query.id);

	//Check if the received ID exist or not
	if (!petByID)
	{
		res.statusMessage = "Pet not found";
		return res.status(404).json({
			message : "Pet not found"
		});
	}

	//Returning the requested object
	//STILL NEED TO CHECK IF IT WORKS
	PetList.getByID(req.query.id)
		.then(pet => {
			return res.status(201).json(pet);
		})
		.catch(err => {
			res.statusMessage = "Something went wrong with the DB";
			return res.status(500).json({
				message : "Something went wrong with the DB",
				status : 500
			});
		});
});

//Add a pet to the list
app.post('/api/postPet', jsonParser, (req, res, next) => {
	//Get the JSON Object
	let {name, typeOfPet, id} = req.body;

	if (!name || !typeOfPet || !id)
	{
		res.statusMessage = "Missing field in body";
		return res.status(406).json({
			message : "Missing field in body",
			status : 406
		});
	}

	//WE STILL NEED TO VALIDATE THAT THE ID IS NOT YET IN THE DATABASE

	let newPet = {
		name,
		typeOfPet,
		id
	};

	PetList.post(newPet)
		.then(pet => {
			return res.status(201).json(pet);
		})
		.catch(err => {
			res.statusMessage = "Something went wrong with the DB";
			return res.status(500).json({
				message : "Something went wrong with the DB",
				status : 500
			});
		});

});


let server;

function runServer(port, databaseUrl){
	return new Promise( (resolve, reject ) => {
		mongoose.connect(databaseUrl, response => {
			if ( response ){
				return reject(response);
			}
			else{
				server = app.listen(port, () => {
					console.log( "App is running on port " + port );
					resolve();
				})
				.on( 'error', err => {
					mongoose.disconnect();
					return reject(err);
				})
			}
		});
	});
}

function closeServer(){
	return mongoose.disconnect()
		.then(() => {
			return new Promise((resolve, reject) => {
				console.log('Closing the server');
				server.close( err => {
					if (err){
						return reject(err);
					}
					else{
						resolve();
					}
				});
			});
		});
}

runServer( PORT, DATABASE_URL )
	.catch( err => {
		console.log( err );
	});

module.exports = { app, runServer, closeServer };