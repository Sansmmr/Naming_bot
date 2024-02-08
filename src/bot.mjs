import TelegramBot from 'node-telegram-bot-api';

const bot = new TelegramBot('6456409918:AAGV70jJY0c1Uigh6HmrG2xsU7KE6HVfQ7M', { polling: true });

const openaiApiKey = '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';
const localServerUrl = 'http://localhost:8080/v1/chat/completions';

// Об'єкт, що містить інформацію про стан користувача
const userState = {};

// Опції клавіатури
const keyboardOptions = {
  reply_markup: {
    keyboard: [
      [{ text: 'Що це таке?' }, { text: 'Для кого це створено?' }, { text: 'Введіть ваш запит' }]
    ],
    resize_keyboard: true
  }
};

// Обробник команди /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  // Відправляємо повідомлення з опціями клавіатури
  bot.sendMessage(chatId, 'Виберіть питання:', keyboardOptions);
});

// Обробник команди "Що це таке?"
bot.onText(/Що це таке\?/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Це бот, який використовує штучний інтелект для генерації відповідей на повідомлення.', keyboardOptions);
});

// Обробник команди "Для кого це створено?"
bot.onText(/Для кого це створено\?/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Цей бот створений для того, щоб надавати користувачам відповіді на їх запитання за допомогою штучного інтелекту.', keyboardOptions);
});

// Обробник повідомлень
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const message = msg.text;

  // Перевіряємо, чи відправлене повідомлення є командою "Введіть ваш запит"
  if (message === 'Введіть ваш запит') {
    // Встановлюємо стан користувача, що він очікує введення запиту
    userState[chatId] = { awaitingInput: true };
    // Відправляємо повідомлення з проханням ввести запит
    bot.sendMessage(chatId, 'Сюди ви можете ввести свій запит:');
  } else {
    // Якщо користувач не очікує введення запиту, обробляємо інші повідомлення
    if (userState[chatId]?.awaitingInput) {
      // Викликаємо функцію для взаємодії з сервером
      const response = await getChatGPTResponse(message);
      // Надсилаємо відповідь користувачеві
      bot.sendMessage(chatId, response);
      // Змінюємо стан користувача
      delete userState[chatId];
    }
  }
});

// Функція для взаємодії з локальним сервером
async function getChatGPTResponse(message) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${openaiApiKey}`
  };

  const body = JSON.stringify({
    model: 'gpt-3.5-turbo-0125',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: message }
    ]
  });

  try {
    const response = await fetch(localServerUrl, {
      method: 'POST',
      headers: headers,
      body: body
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();

    if (result.choices && result.choices.length > 0 && result.choices[0].message) {
      return result.choices[0].message.content;
    } else {
      console.error('Invalid response from local server:', result);
      throw new Error('Invalid response from local server');
    }
  } catch (error) {
    console.error('Error fetching response from local server:', error.message);
    return 'Sorry, something went wrong while processing your request.';
  }
}
