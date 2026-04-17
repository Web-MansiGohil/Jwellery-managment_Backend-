import axios from 'axios';
import FormData from 'form-data';

const checkApi = async () => {
    try {
        const fd = new FormData();
        fd.append('date', '2026-04-10');
        fd.append('timeslot', '10:00 AM');
        fd.append('note', 'Test note');

        console.log("Sending request to add-appointment...");
        const response = await axios.post('http://localhost:5174/api/appointment/add-appointment', fd, {
            headers: fd.getHeaders() // Node.js form-data requires this
        });
        console.log("Success:", response.data);
    } catch (error) {
        if (error.response) {
            console.error("HTTP Error:", error.response.status, error.response.data);
        } else {
            console.error("Unknown Error:", error.message);
        }
    }
};

checkApi();
