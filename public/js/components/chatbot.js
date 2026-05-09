/**
 * Chatbot Component
 * Citizens' Charter Bot with language detection
 */

import { getTranslation } from '../services/i18n.js';

const charterData = {
    mission: {
        en: "Ensuring equal opportunities and full participation of persons with disabilities, providing support and care for the elderly and promoting their participation...",
        am: "የሥራ ስምሪት አገልግሎት እንዲስፋፋ፣ የኢንዱስትሪ ሰላም እንዲሰፍን...",
        om: "Tajaajila hojii bal'isu, nageenya industirii eegu..."
    },
    vision: {
        en: "To be an organization that provides first-class services in the Harare region...",
        am: "ዜጎች ከእኩል ስራ እድል፣ ከማህበራዊ ደህንነትና ከደህንነት አገልግሎቶች...",
        om: "Mul’ata: Hawaasa mirga hojii wal-qixa, eegumsa hawaasaa fi tajaajila fayyaa..."
    },
    values: {
        en: "Transparency, accountability, equality, participation, efficiency, and fairness.",
        am: "ግልጽነት፣ ተጠያቂነት፣ እኩልነት፣ ተሳትፎ፣ ብቃትና ፍትህ።",
        om: "Ifaajee, itti gaafatamummaa, wal-qixa, hirmaannaa, dandeettii fi haqa."
    },
    services: {
        en: "Job matching and employment services, industrial peace facilitation, workplace safety inspection...",
        am: "የሥራ ስምሪትና የቅጥር አገልግሎት፣ የኢንዱስትሪ ሰላም ማስቻል...",
        om: "Hojii walitti hidhuu, nageenya industirii eeguu, balaa hojii to’achuu..."
    },
    rights: {
        en: "Access to information, equal service, right to complaint, and quick response.",
        am: "ሙሉ መረጃ ማግኘት፣ በእኩልነት አገልግሎት መቀበል...",
        om: "Odeeffannoo argachuu, tajaajila walqixa fudhachuu..."
    },
    duties: {
        en: "Respect the law, provide accurate information, fulfill payment obligations.",
        am: "ሕግን መከተል፣ ትክክለኛ መረጃ ማቅረብ...",
        om: "Seera hordofuu, odeeffannoo sirrii kennuu..."
    },
    complaints: {
        en: "Citizens may submit complaints in writing or verbally and must receive a response within the standard timeframe.",
        am: "ዜጎች ቅሬታ በፅሁፍ ወይም በቃል ማቅረብ ይችላሉ...",
        om: "Hawaasni komii barreeffamaan ykn afaaniin dhiyeeffachuu danda’a..."
    },
    standards: {
        en: "Fair, transparent, efficient, and citizen-centered services within the promised timeframe.",
        am: "ፍትሃዊ፣ ግልጽ፣ ብቃት ያለው እና በዜጋ ማዕከላዊነት...",
        om: "Tajaajila haqaa, ifa, dandeettii qabu, hawaasa irratti xiyyeeffate..."
    }
};

export async function loadChatbot() {
    console.log('========== CHATBOT LOAD DEBUG ==========');
    
    const possiblePaths = [
        '/components/chatbot.html',
        '/public/components/chatbot.html',
        'components/chatbot.html',
        './components/chatbot.html',
        '../components/chatbot.html',
        `${window.location.origin}/components/chatbot.html`,
        `${window.location.origin}/public/components/chatbot.html`
    ];
    
    console.log('Trying paths:', possiblePaths);
    
    for (const path of possiblePaths) {
        try {
            console.log(`   Trying: ${path}`);
            const response = await fetch(path);
            
            if (response.ok) {
                const html = await response.text();
                console.log(`   ✅ SUCCESS! Found chatbot at: ${path}`);
                document.body.insertAdjacentHTML('beforeend', html);
                initChatbot();
                console.log('========== CHATBOT LOAD COMPLETE ==========');
                return;
            } else {
                console.log(`   ❌ Failed (${response.status}): ${path}`);
            }
        } catch (error) {
            console.log(`   ❌ Error: ${path} - ${error.message}`);
        }
    }
    
    console.error('❌ ALL PATHS FAILED - Could not load chatbot!');
    console.log('========== DEBUG END ==========');
}

function initChatbot() {
    const toggle = document.getElementById('chatbot-toggle');
    const container = document.getElementById('chat-container');
    const sendBtn = document.getElementById('sendBtn');
    const userInput = document.getElementById('userInput');
    const chatbox = document.getElementById('chatbox');
    
    if (toggle && container) {
        toggle.addEventListener('click', () => {
            container.style.display = container.style.display === 'none' ? 'flex' : 'none';
        });
    }
    
    if (sendBtn && userInput && chatbox) {
        sendBtn.addEventListener('click', () => sendMessage(userInput, chatbox));
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage(userInput, chatbox);
        });
    }
}

function sendMessage(input, chatbox) {
    const message = input.value.trim();
    if (!message) return;
    
    // Add user message
    chatbox.innerHTML += `<div class="message user">${message}</div>`;
    input.value = '';
    chatbox.scrollTop = chatbox.scrollHeight;
    
    // Detect language
    const lang = detectLanguage(message);
    let reply = '';
    
    // Match keywords
    if (/(mission|ተልዕኮ|ergama)/i.test(message)) reply = charterData.mission[lang];
    else if (/(vision|ራዕይ|mul'ata|mulata)/i.test(message)) reply = charterData.vision[lang];
    else if (/(value|እሴት|gatii)/i.test(message)) reply = charterData.values[lang];
    else if (/(service|አገልግሎት|tajaajila)/i.test(message)) reply = charterData.services[lang];
    else if (/(right|መብት|mirga)/i.test(message)) reply = charterData.rights[lang];
    else if (/(duty|ግዴታ|dirqama)/i.test(message)) reply = charterData.duties[lang];
    else if (/(complaint|ቅሬታ|komii)/i.test(message)) reply = charterData.complaints[lang];
    else if (/(standard|መደብ|sadarkaa)/i.test(message)) reply = charterData.standards[lang];
    else {
        reply = lang === 'am' ? 'ይቅርታ፣ መልስ አልተገኘም።' :
                lang === 'om' ? 'Dhiifama, deebiin hin argamne.' :
                'Sorry, I could not find an answer in the Charter.';
    }
    
    // Add bot reply
    setTimeout(() => {
        chatbox.innerHTML += `<div class="message bot">${reply}</div>`;
        chatbox.scrollTop = chatbox.scrollHeight;
    }, 300);
}

function detectLanguage(text) {
    if (/[አ-ኸ]/.test(text)) return 'am';
    if (/(mirga|ergama|tajaajila|dirqama|komii|mul'ata|mulata|gatii)/i.test(text)) return 'om';
    return 'en';
}