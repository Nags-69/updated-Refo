import fs from 'fs';
import https from 'https';

const key = "AIzaSyBLIwsNRumekZD9xw9Il0dFCNCK1WDXs-M";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.models) {
                const names = json.models.map(m => m.name).join('\n');
                fs.writeFileSync('models.txt', names);
                console.log("Models written to models.txt");
            } else {
                console.log("No models found", json);
            }
        } catch (e) {
            console.error(e);
        }
    });
});
