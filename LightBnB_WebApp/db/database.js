const properties = require("./json/properties.json");
const users = require("./json/users.json");

const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  host: 'localhost',
  database: 'lightbnb'
});


const args = process.argv.slice(2);

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  // let resolvedUser = null;
  // for (const userId in users) {
  //   const user = users[userId];
  //   if (user?.email.toLowerCase() === email?.toLowerCase()) {
  //     resolvedUser = user;
  //   }
  // }
  //eturn Promise.resolve(resolvedUser);
  
  return pool.query('SELECT * FROM users WHERE email = $1',[email])
    .then(result => {

      if (!result.rows[0])
        return null;
      return result.rows[0];

    })
    .catch(err => {
      console.log(err.message);
    }
    );
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  // return Promise.resolve(users[id]);

  return pool.query('SELECT * FROM users WHERE id = $1',[id])
    .then(result => {
      if (!result.rows[0])
        return null;
      return result.rows[0];

    })
    .catch(err => {
      console.log(err.message);
    }
    );
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function(user) {
  // const userId = Object.keys(users).length + 1;
  // user.id = userId;
  // users[userId] = user;
  // return Promise.resolve(user);

  const name = user['name'];
  const email = user['email'];
  const password = user['password'];

  return pool.query('INSERT INTO USERS (name, email, password) VALUES ($1, $2, $3) RETURNING *',[name, email, password])
    .then(result => {
      if (!result.rows[0])
        return null;
      return result.rows[0];

    })
    .catch(err => {
      console.log(err.message);
    }
    );
};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guestId, limit = 10) {
  //return getAllProperties(null, 2);

  const query = `SELECT r.*, p.*, AVG(pr.rating) AS average_rating
  FROM reservations r
  JOIN properties p ON r.property_id = p.id
  JOIN property_reviews pr ON p.id = pr.property_id
  WHERE r.guest_id = $1
  GROUP BY r.id, p.title, r.start_date, p.id
  ORDER BY r.start_date
  LIMIT $2;
  `;


  return pool
    .query(query, [guestId, limit])
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = (options, limit = 10) => {
  const { city, owner_id: ownerId, minimum_price_per_night: minPricePerNight, maximum_price_per_night: maxPricePerNight, minimum_rating: minRating } = options;
  
  const queryParams = [];
  let queryString = `
    SELECT properties.*, avg(property_reviews.rating) as average_rating
    FROM properties
    JOIN property_reviews ON properties.id = property_id
  `;

  if (city) {
    queryParams.push(`%${city}%`);
    queryString += queryParams.length > 1 ? `AND city LIKE $${queryParams.length} ` : `WHERE city LIKE $${queryParams.length} `;
  }

  if (ownerId) {
    queryParams.push(ownerId);
    queryString += queryParams.length > 1 ? `AND owner_id = $${queryParams.length} ` : `WHERE owner_id = $${queryParams.length} `;
  }

  if (minPricePerNight) {
    queryParams.push(minPricePerNight * 100);
    queryString += queryParams.length > 1 ? `AND cost_per_night >= $${queryParams.length} ` : `WHERE cost_per_night >= $${queryParams.length} `;
  }

  if (maxPricePerNight) {
    queryParams.push(maxPricePerNight * 100);
    queryString += queryParams.length > 1 ? `AND cost_per_night <= $${queryParams.length} ` : `WHERE cost_per_night <= $${queryParams.length} `;
  }

  if (minRating) {
    queryParams.push(minRating);
    queryString += queryParams.length > 1 ? `AND average_rating >= $${queryParams.length} ` : `WHERE average_rating >= $${queryParams.length} `;
  }

  queryParams.push(limit);
  queryString += `
    GROUP BY properties.id
    ORDER BY cost_per_night
    LIMIT $${queryParams.length};
  `;

  return pool.query(queryString, queryParams).then((res) => res.rows);
};



/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  // const propertyId = Object.keys(properties).length + 1;
  // property.id = propertyId;
  // properties[propertyId] = property;
  // return Promise.resolve(property);


  const title = property['title'];
  const description = property['description'];
  const thumbnailUrl = property['thumbnail_photo_url'];
  const coverPhotoUrl = property['cover_photo_url'];
  const costPerNight = property['cost_per_night'];
  const street = property['street'];
  const city = property['city'];
  const province = property['province'];
  const postCode = property['post_code'];
  const country = property['country'];
  const parkingSpaces = property['parking_spaces'];
  const NumOfBathrooms = property['number_of_bathrooms'];
  const numOfBedrooms = property['number_of_bedrooms'];

  const query = ` INSERT INTO properties (title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *;`;




  return pool.query(query,[title, description, thumbnailUrl, coverPhotoUrl, costPerNight, street, city, province, postCode, country, parkingSpaces, NumOfBathrooms, numOfBedrooms])
    .then(result => {
      if (!result.rows[0])
        return null;
      console.log(result.rows[0]);
      return result.rows[0];

    })
    .catch(err => {
      console.log(err.message);
    }
    );


};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};

// getUserWithEmail('allisonjackson@mail.com');