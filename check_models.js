const key = "AIzaSyBLIwsNRumekZD9xw9Il0dFCNCK1WDXs-M";

async function testGeneration() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent?key=${key}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hello" }] }]
            })
        });
        const data = await response.json();

        if (data.error) {
            console.error("Generation Error:", data.error);
        } else {
            console.log("Generation Success!");
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Request error:", e);
    }
}

testGeneration();
