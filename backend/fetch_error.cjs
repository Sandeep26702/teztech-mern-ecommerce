const https = require('https');

const data = JSON.stringify({
  email: 'sonani123@gmail.com',
  password: 'sonani123'
});

const options = {
  hostname: 'sonani-backend.onrender.com',
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const token = JSON.parse(body).token;
    
    const getOptions = {
      hostname: 'sonani-backend.onrender.com',
      path: '/api/shipping',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const getReq = https.request(getOptions, getRes => {
      let getBody = '';
      getRes.on('data', d => getBody += d);
      getRes.on('end', () => {
        console.log("STATUS CODE:", getRes.statusCode);
        console.log("RESPONSE BODY:", getBody);
      });
    });
    getReq.end();
  });
});
req.write(data);
req.end();
