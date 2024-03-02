

import mysql2 from 'mysql2'

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv';
import session from 'express-session';
import cookieParser from 'cookie-parser'
import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid';
import jwt from'jsonwebtoken';
const mysql2 = require('mysql2');
const express = require('express')
const dotenv = require('dotenv');
var cors = require('cors')
var session = require('express-session')
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const uuidv4  =require('uuid')
dotenv.config();



const app = express();
app.use(cors())
app.use(express.json())
const connection = mysql2.createConnection({
  host: 'localhost',
  user: 'root',
  password: process.env.passSQL,
  database: 'first'
});
app.use(cookieParser());
app.use(session({
  secret: 'secret_key',
  resave: true,
  saveUninitialized: true
}))

connection.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL database: ', err);
    return;
  }
  console.log('Connected to MySQL database');
});

function getDataALL(url, table) {
  app.get(url, (req, res) => {
    connection.query(`SELECT * FROM ${table}`, (err, results) => {
      if (err) {
        console.error('Error fetching data from MySQL: ', err);
        res.status(500).send('Error fetching data from MySQL');
        return;
      }
      res.json(results);
    });
  });
}
getDataALL('/api/petTable', 'pet2')

app.get('/api/petALL', (req, res) => {
  connection.query(`SELECT * FROM pet2 left join adoption on pet2.ID=adoption.id_pet left join likes on pet2.ID=likes.id_pet`, (err, results) => {
    if (err) {
      console.error('Error fetching data from MySQL: ', err);
      res.status(500).send('Error fetching data from MySQL');
      return;
    }
    res.json(results);
  });
});
app.get('/api/petAllNOLikes', (req, res) => {
  connection.query(`SELECT * FROM pet2 left join adoption on pet2.ID=adoption.id_pet `, (err, results) => {
    if (err) {
      console.error('Error fetching data from MySQL: ', err);
      res.status(500).send('Error fetching data from MySQL');
      return;
    }
    res.json(results);
  });
});

app.get('/api/getPets/:user', (req, res) => {
  const user = req.params.user;
  connection.query('SELECT pet2.ID FROM pet2 left join adoption on pet2.ID=adoption.id_pet left join likes on pet2.ID=likes.id_pet where adoption.id_user=? or likes.id_user=?', [user,user], (err, results) => {
    if (err) {
      console.error('Error fetching data from MySQL: ', err);
      res.status(500).send('Error fetching data from MySQL');
      return;
    }
    if (results.length === 0) {
      res.status(404).send('Data not found');
      return;
    }
    res.json(results);
  });
});

app.get('/api/pet/:id', (req, res) => {
  const id = req.params.id;
  connection.query('SELECT * FROM pet2 left join adoption on pet2.ID=adoption.id_pet left join likes on pet2.ID=likes.id_pet  WHERE pet2.ID = ?', [id], (err, results) => {
    if (err) {
      console.error('Error fetching data from MySQL: ', err);
      res.status(500).send('Error fetching data from MySQL');
      return;
    }
    if (results.length === 0) {
      res.status(404).send('Data not found');
      return;
    }
    res.json(results);;
  });
});
app.get('/api/userParam/:user', (req, res) => {
  const user = req.params.user;
  connection.query('SELECT * FROM persons  WHERE user_id = ?', [user], (err, results) => {
    if (err) {
      console.error('Error fetching data from MySQL: ', err);
      res.status(500).send('Error fetching data from MySQL');
      return;
    }
    if (results.length === 0) {
      res.status(404).send('Data not found');
      return;
    }
    res.json(results);;
  });
});

app.get('/api/dataUser', (req, res) => {

  const ids = req.query.ids; 
  

  const query = `SELECT * FROM pet2 left join adoption on pet2.ID=adoption.id_pet left join likes on pet2.ID=likes.id_pet WHERE pet2.ID IN (${ids}) AND  pet_status != 'Not_Adopted'`;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching data from MySQL: ', err);
      res.status(500).send('Error fetching data from MySQL');
      return;
    }
    res.json(results);
  });
});
app.get('/api/dataUserLikes', (req, res) => {

  const ids = req.query.ids; 
  

  const query = `SELECT * FROM pet2 left join adoption on pet2.ID=adoption.id_pet left join likes on pet2.ID=likes.id_pet WHERE pet2.ID IN (${ids}) AND likes is not  NULL`;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching data from MySQL: ', err);
      res.status(500).send('Error fetching data from MySQL');
      return;
    }
    res.json(results);
  });
});

app.get('/api/search', (req, res) => {
  let { Type, AdoptionStatus, Name, minWeight, maxWeight, minHeight, maxHeight } = req.query;

  let query = 'SELECT Distinct pet2.ID,Type, Name, Weight, Weight,Foto,pet_status FROM pet2 left join adoption on pet2.ID=adoption.id_pet left join likes on pet2.ID=likes.id_pet WHERE 1=1';

  let queryParams = [];

  if (Type) {
    query += ' AND Type = ?';
    queryParams.push(`${Type}`);
  }

  if (AdoptionStatus) {
    query += ' AND pet_status = ?';
    queryParams.push(`${AdoptionStatus}`);
  }
  if (Name) {
    query += ' AND Name LIKE ?';
    queryParams.push(`%${Name}%`);
  }
  if (minWeight) {
    query += ' AND Weight >  ?';
    queryParams.push(`${minWeight}`);
  }
  if (maxWeight) {
    query += ' AND Weight <  ?';
    queryParams.push(`${maxWeight}`);
  }
  if (minHeight) {
    query += ' AND Height >  ?';
    queryParams.push(`${minHeight}`);
  }
  if (maxHeight) {
    query += ' AND Height <  ?';
    queryParams.push(`${maxHeight}`);
  }


  connection.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Error fetching data from MySQL: ', err);
      res.status(500).send('Error fetching data from MySQL');
      return;
    }
    res.json(results);
  });
});


app.post('/api/signin', (req, res) => {
  const { email, password } = req.body;


  connection.query('SELECT * FROM persons WHERE email = ?', [email], (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = results[0];


    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (!result) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      res.cookie('admin', user.role, { maxAge: 900000 , httpOnly: true , secure:true});
      res.cookie('user_id', user.user_id, { maxAge: 900000 });
      // res.status(200).json({ message: 'Signin successful' });
      res.json(results)
    });
    
   
  })
   ;
});





getDataALL('/api/user', 'Persons')


app.post('/api/regis', (req, res) => {

  const { name, Lname, email, phone, password, role } = req.body;
  const userId = uuidv4();
  connection.query('SELECT * FROM persons WHERE email = ?', [email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length > 0) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    
   
  

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  const newUser = { user_id: userId, name, Lname, email, phone, password, role };
  connection.query('INSERT INTO Persons SET ?', newUser, (err, results) => {
    if (err) {
      console.error('Error inserting data into MySQL: ', err);
      res.status(500).send('Error inserting data into MySQL');
      return;
    }
    res.cookie('user_id', userId, { maxAge: 900000, httpOnly: false , secure:false });

    res.status(201).send('Data inserted successfully');
    res.json(results)
  });
});// res.json(res)
});
app.post('/api/adoption', (req, res) => {
  const { id_user, id_pet, pet_status } = req.body;
  connection.query('INSERT INTO adoption (id_user,id_pet,pet_status) VALUES (?, ?,?)', [id_user, id_pet, pet_status], (err, results) => {
    if (err) {
      console.error('Error inserting data into MySQL: ', err);
      res.status(500).send('Error inserting data into MySQL');
      return;
    }
    res.status(201).send('Data inserted successfully');
  });
});
app.post('/api/like', (req, res) => {
  const { id_user, id_pet, likes } = req.body;
  connection.query('INSERT INTO likes (id_user,id_pet,likes) VALUES (?, ?,?)', [id_user, id_pet, likes], (err, results) => {
    if (err) {
      console.error('Error inserting data into MySQL: ', err);
      res.status(500).send('Error inserting data into MySQL');
      return;
    }
    res.status(201).send('Data inserted successfully');
  });
});





// Create data
app.post('/api/add_pet', (req, res) => {
  const updatedPetInfo = req.body;
  connection.query('INSERT INTO pet2 SET ?', [ updatedPetInfo ], (err, results) => {
    if (err) {
      console.error('Error inserting data into MySQL: ', err);
      res.status(500).send('Error inserting data into MySQL');
      return;
    }
    res.status(201).send('Data inserted successfully');
  });
});

// Update data
app.put('/api/pet/:id', (req, res) => {
  const id = req.params.id;
  const updatedPetInfo = req.body;

  connection.query('UPDATE pet2 SET ? WHERE ID = ?', [updatedPetInfo, id], (error, results) => {
    if (error) {
      console.error('Error updating pet:', error);
      res.status(500).send('Error updating pet');
    } else {
      console.log('Pet updated successfully');
      res.status(200).send('Pet updated successfully');
    }
  });
});
app.put('/api/user/:user', (req, res) => {
  const user = req.params.user;
  const updatedPetInfo = req.body;

  connection.query('UPDATE persons SET ? WHERE user_id = ?', [updatedPetInfo, user], (error, results) => {
    if (error) {
      console.error('Error updating pet:', error);
      res.status(500).send('Error updating pet');
    } else {
      console.log('Pet updated successfully');
      res.status(200).send('Pet updated successfully');
    }
  });
});
app.put('/api/user/:user', (req, res) => {
  const user = req.params.user;
  const updatedPetInfo = req.body;

  connection.query('UPDATE persons SET ? WHERE id = ?', [updatedPetInfo, user], (error, results) => {
    if (error) {
      console.error('Error updating pet:', error);
      res.status(500).send('Error updating pet');
    } else {
      console.log('Pet updated successfully');
      res.status(200).send('Pet updated successfully');
    }
  });
});

// Delete data
app.delete('/api/delet_adoption/:id', (req, res) => {
  const id = req.params.id;
  connection.query('DELETE FROM adoption WHERE id_pet = ? AND pet_status="Not_Adopted" or pet_status="Fostered" ', [id], (err, results) => {
    if (err) {
      console.error('Error deleting data from MySQL: ', err);
      res.status(500).send('Error deleting data from MySQL');
      return;
    }
    res.status(200).send('Data deleted successfully');
  });
});
app.delete('/api/delet_adoption_fost/:id', (req, res) => {
  const id = req.params.id;
  connection.query('DELETE FROM adoption WHERE id_pet = ? AND pet_status="Not_Adopted" ', [id], (err, results) => {
    if (err) {
      console.error('Error deleting data from MySQL: ', err);
      res.status(500).send('Error deleting data from MySQL');
      return;
    }
    res.status(200).send('Data deleted successfully');
  });
});
app.delete('/api/shelter/:id/:user', (req, res) => {
  const id = req.params.id;
  const user = req.params.user;
  connection.query('DELETE FROM adoption WHERE id_pet = ? AND id_user=?', [id, user], (err, results) => {
    if (err) {
      console.error('Error deleting data from MySQL: ', err);
      res.status(500).send('Error deleting data from MySQL');
      return;
    }
    res.status(200).send('Data deleted successfully');
  });
});
app.delete('/api/like/:id/:user_id', (req, res) => {
  const id = req.params.id;
  const user_id = req.params.user_id;
  connection.query('DELETE FROM likes WHERE id_pet = ? AND id_user=?', [id, user_id], (err, results) => {
    if (err) {
      console.error('Error deleting data from MySQL: ', err);
      res.status(500).send('Error deleting data from MySQL');
      return;
    }
    res.status(200).send('Data deleted successfully');
  });
});

  app.delete('/api/deletUser/:id', (req, res) => {
    const id = req.params.id;
    connection.query(`DELETE FROM persons WHERE id = ?`, [id], (err, results) => {
      if (err) {
        console.error('Error deleting data from MySQL: ', err);
        res.status(500).send('Error deleting data from MySQL');
        return;
      }
      res.status(200).send('Data deleted successfully');
    });
  });
  app.delete('/api/deletPet/:id', (req, res) => {
    const id = req.params.id;
    connection.query(`DELETE FROM pet2 WHERE ID = ?`, [id], (err, results) => {
      if (err) {
        console.error('Error deleting data from MySQL: ', err);
        res.status(500).send('Error deleting data from MySQL');
        return;
      }
      res.status(200).send('Data deleted successfully');
    });
  });
app.get('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.send('Logged out successfully');
});
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
