const axios = require('axios');

async function testPatch() {
  try {
    const loginRes = await axios.post('https://cleanreport-api.onrender.com/api/v1/auth/login', {
      email: 'testagent89@example.com',
      password: 'Password123!'
    });
    const token = loginRes.data.data.token;
    console.log('Got token');

    const reqs = await axios.get('https://cleanreport-api.onrender.com/api/v1/admin/redemption-requests', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const claims = reqs.data.data.content || reqs.data.data;
    console.log('Claims:', claims.length);
    if (claims.length === 0) return;

    const claimId = claims[0].id;
    console.log('Trying to patch claim:', claimId);

    const patchRes = await axios.patch(`https://cleanreport-api.onrender.com/api/v1/admin/redemption-requests/${claimId}/status`, 
      { status: 'APPROVED' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Patch success:', patchRes.data);

  } catch (error) {
    console.error('Error:', error.response?.status, error.response?.data || error.message);
  }
}
testPatch();
