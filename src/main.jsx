import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.jsx';
import {Boundary} from './ui.jsx';
import {initializeLanguage} from './i18n.js';
import './styles.css';
initializeLanguage();
createRoot(document.getElementById('root')).render(<React.StrictMode><Boundary><App/></Boundary></React.StrictMode>);
