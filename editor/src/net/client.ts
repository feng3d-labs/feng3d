let connection: WebSocket;
let clientID = 0;

function setUsername()
{
    console.log('***SETUSERNAME');
    const msg = {
        name: 'user-feng',
        date: Date.now(),
        id: clientID,
        type: 'username'
    };
    connection.send(JSON.stringify(msg));
}

function connect()
{
    let scheme = 'ws';

    // If this is an HTTPS connection, we have to use a secure WebSocket
    // connection too, so add another "s" to the scheme.

    if (document.location.protocol === 'https:')
    {
        scheme += 's';
    }

    const serverUrl = `${scheme}://${document.location.hostname}:6502`;

    connection = new WebSocket(serverUrl, 'json');
    console.log('***CREATED WEBSOCKET');

    connection.onopen = function (_evt)
    {
        console.log('***ONOPEN');
    };
    console.log('***CREATED ONOPEN');

    connection.onmessage = function (evt)
    {
        console.log('***ONMESSAGE');
        const f = {
            write(text: string)
            {
                console.log(`write: ${text}`);
            }
        };
        let text = '';
        const msg = JSON.parse(evt.data);
        console.log('Message received: ');
        console.dir(msg);
        const time = new Date(msg.date);
        const timeStr = time.toLocaleTimeString();

        switch (msg.type)
        {
            case 'id':
                clientID = msg.id;
                setUsername();
                break;
            case 'username':
                text = `<b>User <em>${msg.name}</em> signed in at ${timeStr}</b><br>`;
                break;
            case 'message':
                text = `(${timeStr}) <b>${msg.name}</b>: ${msg.text}<br>`;
                break;
            case 'rejectusername':
                text = `<b>Your username has been set to <em>${msg.name}</em> because the name you chose is in use.</b><br>`;
                break;
            case 'userlist':
                let ul = '';

                for (let i = 0; i < msg.users.length; i++)
                {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    ul += `${msg.users[i]}<br>`;
                }
                break;
        }

        if (text.length)
        {
            f.write(text);
        }
    };
    console.log('***CREATED ONMESSAGE');
}

function send()
{
    console.log('***SEND');
    const msg = {
        text: 'send msg',
        type: 'message',
        id: clientID,
        date: Date.now()
    };
    connection.send(JSON.stringify(msg));
}

export const client = { connect, send };
