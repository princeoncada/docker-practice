import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
    const [response, setResponse] = useState([
        {
            id: 1,
            data: "default data #1"
        },
        {
            id: 2,
            data: "default data #2"
        },
        {
            id: 3,
            data: "default data #3"
        }
    ]);
    const [counter, setCounter] = useState(0);

    // Function to fetch data from the server
    function fetchData() {
        axios.get('/api/data')
            .then((response) => {
                setResponse(response.data);
            })
            .catch((error) => {
                console.error('Error fetching data:', error);
            });
    }

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <>
            <button onClick={() => setCounter((count) => count + 1)}>
                {response[counter%response.length].data}
            </button>
        </>
    )
}

export default App
