import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

async function upload() {
    const form = new FormData();

    // ВАЖНО: 'file' — это то, что ты выбрал в n8n (Field Name for Binary Data)
    // './passport.jpg' — это путь к картинке на твоем компе. Положи картинку рядом с этим файлом!
    form.append('file', fs.createReadStream('./passport.jpg'));

    try {
        console.log('Отправляю файл в n8n...');
        const response = await axios.post('https://jamacoder.app.n8n.cloud/webhook-test/new-worker', form, {
            headers: form.getHeaders(),
        });
        console.log('Успех! ИИ ответил:', JSON.stringify(response.data, null, 2));
    } catch (err) {
        console.error('Ошибка:', err.message);
    }
}

upload();
