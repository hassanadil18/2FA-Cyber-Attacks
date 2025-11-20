const bcrypt = require('bcryptjs');
const database = require('./database');

class User {
 constructor(userData) {
 this.id = userData.id;
 this.username = userData.username;
 this.email = userData.email;
 this.password_hash = userData.password_hash;
 this.phone = userData.phone;
 this.is_2fa_enabled = userData.is_2fa_enabled;
 this.totp_secret = userData.totp_secret;
 this.backup_codes = userData.backup_codes;
 this.created_at = userData.created_at;
 this.updated_at = userData.updated_at;
 }

 static async create(userData) {
 const { username, email, password, phone } = userData;
 const password_hash = await bcrypt.hash(password, 12);
 
 return new Promise((resolve, reject) => {
 const query = `
 INSERT INTO users (username, email, password_hash, phone)
 VALUES (?, ?, ?, ?)
 `;
 
 database.getDB().run(query, [username, email, password_hash, phone], function(err) {
 if (err) {
 reject(err);
 } else {
 resolve({ id: this.lastID, username, email, phone });
 }
 });
 });
 }

 static async findById(id) {
 return new Promise((resolve, reject) => {
 const query = 'SELECT * FROM users WHERE id = ?';
 
 database.getDB().get(query, [id], (err, row) => {
 if (err) {
 reject(err);
 } else if (row) {
 resolve(new User(row));
 } else {
 resolve(null);
 }
 });
 });
 }

 static async findByUsername(username) {
 return new Promise((resolve, reject) => {
 const query = 'SELECT * FROM users WHERE username = ?';
 
 database.getDB().get(query, [username], (err, row) => {
 if (err) {
 reject(err);
 } else if (row) {
 resolve(new User(row));
 } else {
 resolve(null);
 }
 });
 });
 }

 static async findByEmail(email) {
 return new Promise((resolve, reject) => {
 const query = 'SELECT * FROM users WHERE email = ?';
 
 database.getDB().get(query, [email], (err, row) => {
 if (err) {
 reject(err);
 } else if (row) {
 resolve(new User(row));
 } else {
 resolve(null);
 }
 });
 });
 }

 async verifyPassword(password) {
 return await bcrypt.compare(password, this.password_hash);
 }

 async updateTOTPSecret(secret) {
 return new Promise((resolve, reject) => {
 const query = 'UPDATE users SET totp_secret = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
 
 database.getDB().run(query, [secret, this.id], (err) => {
 if (err) {
 reject(err);
 } else {
 this.totp_secret = secret;
 resolve();
 }
 });
 });
 }

 async enable2FA() {
 return new Promise((resolve, reject) => {
 const query = 'UPDATE users SET is_2fa_enabled = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
 
 database.getDB().run(query, [this.id], (err) => {
 if (err) {
 reject(err);
 } else {
 this.is_2fa_enabled = true;
 resolve();
 }
 });
 });
 }

 async disable2FA() {
 return new Promise((resolve, reject) => {
 const query = `
 UPDATE users 
 SET is_2fa_enabled = 0, totp_secret = NULL, backup_codes = NULL, updated_at = CURRENT_TIMESTAMP 
 WHERE id = ?
 `;
 
 database.getDB().run(query, [this.id], (err) => {
 if (err) {
 reject(err);
 } else {
 this.is_2fa_enabled = false;
 this.totp_secret = null;
 this.backup_codes = null;
 resolve();
 }
 });
 });
 }

 async updateBackupCodes(codes) {
 return new Promise((resolve, reject) => {
 const codesJson = JSON.stringify(codes);
 const query = 'UPDATE users SET backup_codes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
 
 database.getDB().run(query, [codesJson, this.id], (err) => {
 if (err) {
 reject(err);
 } else {
 this.backup_codes = codesJson;
 resolve();
 }
 });
 });
 }

 getBackupCodes() {
 if (this.backup_codes) {
 return JSON.parse(this.backup_codes);
 }
 return [];
 }

 toSafeObject() {
 return {
 id: this.id,
 username: this.username,
 email: this.email,
 phone: this.phone,
 is_2fa_enabled: this.is_2fa_enabled,
 created_at: this.created_at,
 updated_at: this.updated_at
 };
 }

 static async getAllUsers() {
 return new Promise((resolve, reject) => {
 const query = 'SELECT * FROM users ORDER BY created_at DESC';
 
 database.getDB().all(query, [], (err, rows) => {
 if (err) {
 reject(err);
 } else {
 const users = rows.map(row => new User(row));
 resolve(users);
 }
 });
 });
 }
}

module.exports = User;