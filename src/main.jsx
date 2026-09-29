import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.jsx';
import {Boundary} from './ui.jsx';
import './styles.css';
createRoot(document.getElementById('root')).render(<React.StrictMode><Boundary><App/></Boundary></React.StrictMode>);
