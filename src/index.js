'use strict';

const formAuthorization = document.querySelector('.formAuthorization');
const formList = document.querySelector('.formList');
const input = document.querySelector('.textArea');
const noteList = document.querySelector('ul');
const login = document.querySelector('.login');
const password = document.querySelector('.password');
const toDoList = document.querySelector('.toDoList');
let acsesToken = '';
let taskList = [];
const loader = document.querySelector('.banter-loader');
const formDate = date => moment(date).fromNow();  // eslint-disable-line 

function renderTask(taskObject) {
    const taskItem = document.createElement('li');
    const createData = document.createElement('span');
    const editInput = document.createElement('input');
    const taskItemContent = document.createElement('label');
    const taskItemBtnEdit = document.createElement('button');
    const taskItemBtnComplete = document.createElement('button');
    const taskItemBtnRemove = document.createElement('button');

    editInput.type = 'text';

    createData.classList.add('dateForm');
    taskItem.classList.add('note-list__item');
    taskItemBtnEdit.classList.add('edit');
    taskItemBtnComplete.classList.add('complete');
    taskItemBtnRemove.classList.add('remove');

    taskItemContent.innerText = taskObject.value;
    createData.innerText = formDate(taskObject.time);
    taskItemBtnEdit.innerText = 'Edit';
    taskItemBtnComplete.innerText = 'Complete';
    taskItemBtnRemove.innerText = 'Remove';

    taskItem.setAttribute('data-time', taskObject.time);
    taskItem.setAttribute('data-id', taskObject.id);

    taskItem.appendChild(createData);
    taskItem.appendChild(editInput);
    taskItem.appendChild(taskItemContent);
    taskItem.appendChild(taskItemBtnComplete);
    taskItem.appendChild(taskItemBtnRemove);
    taskItem.appendChild(taskItemBtnEdit);

    if (taskObject.checked) {
        taskItem.classList.add('completedTask');
        taskItemBtnEdit.disabled = true;
        taskItemBtnComplete.disabled = true;
    }
    return taskItem;
}

noteList.addEventListener('click', e => {
    const element = e.target;
    const itemTime = currentTime => taskList.find(task => task.time === currentTime);
    let currentTime;
    let currentId;
    if (element.className === 'complete' || element.className === 'remove' || element.className === 'edit') {
        currentTime = element.closest('li').getAttribute('data-time');
        currentId = element.closest('li').getAttribute('data-id');
    }

    if (element.className === 'complete' && element.tagName === 'BUTTON') {
        itemTime(currentTime).checked = true;
        fetch(`https://todo.hillel.it/todo/${currentId}/toggle`, {
            method: 'PUT',
            headers: {
                'Content-type': 'application/json',
                'Authorization': `Bearer ${acsesToken}`
            }
        }).then(response => response.json())
            .then(() => {
                taskList = taskList.map(note => ({
                    ...note,
                    checked: note._id === currentId ? note.checked : note.checked
                }));
                noteList.innerHTML = '';

                taskList.forEach(task => {
                    noteList.append(renderTask(task));
                });
            });
    }
    if (element.className === 'remove' && element.tagName === 'BUTTON') {
        fetch(`https://todo.hillel.it/todo/${currentId}`, {
            method: 'DELETE',
            cache: 'no-cache',
            headers: {
                'Content-type': 'application/json',
                Authorization: `Bearer ${acsesToken}`
            },
        }).then(response => response.json());

        noteList.innerHTML = '';
        taskList = taskList.filter(task => task.time !== currentTime);

        taskList.forEach(task => {
            noteList.append(renderTask(task));
        });
    }
    if (element.className === 'edit' && element.tagName === 'BUTTON') {
        if (element.closest('li').classList.contains('editMode')) {
            itemTime(currentTime).value = element.closest('li').querySelector('INPUT').value;

            noteList.innerHTML = '';
            taskList.forEach(task => {
                noteList.append(renderTask(task));
            });
        } else {
            element.closest('li').querySelector('INPUT').value = itemTime(currentTime).value;
        }
        element.closest('li').classList.toggle('editMode');
        fetch(`https://todo.hillel.it/todo/${currentId}`, {
            method: 'PUT',
            headers: {
                'Content-type': 'application/json',
                Authorization: `Bearer ${acsesToken}`
            },
            body: JSON.stringify({
                value: element.closest('li').querySelector('INPUT').value,
                priority: 1
            })
        }).then(response => response.json());
    }
});

formAuthorization.addEventListener('submit', e => {
    e.preventDefault();

    loader.classList.remove('displayNone');

    fetch('https://todo.hillel.it/auth/login', {
        method: 'POST',
        cache: 'no-cache',
        headers: {
            'Content-type': 'application/json',
        },
        body: JSON.stringify({
            value: login.value + password.value
        })
    }).then(response => response.json())
        .then(res => {
            acsesToken = res.access_token;
            fetch('https://todo.hillel.it/todo', {
                method: 'GET',
                headers: {
                    'Content-type': 'application/json',
                    'Authorization': `Bearer ${acsesToken}`
                },
            }).then(response => response.json())
                .then(data => {
                    for (let i = 0; i < data.length; i++) {
                        const task = {
                            value: data[i].value,
                            checked: data[i].checked,
                            id: data[i]._id,
                            time: data[i].addedAt
                        };
                        taskList.unshift(task);
                        noteList.prepend(renderTask(task));
                    }
                });
            loader.classList.add('displayNone');
        });
    if (password.value.trim() && login.value.trim()) {
        formAuthorization.classList.add('displayNone');
        toDoList.classList.remove('displayNone');
    }
});

formList.addEventListener('submit', e => {
    e.preventDefault();

    loader.classList.remove('displayNone');

    fetch('https://todo.hillel.it/todo', {
        method: 'POST',
        headers: {
            'Content-type': 'application/json',
            Authorization: `Bearer ${acsesToken}`
        },
        body: JSON.stringify({
            value: input.value,
            priority: 1
        })
    }).then(response => response.json())
        .then(data => {
            if (data.value !== undefined) {    // eslint-disable-line 
                const task = {
                    value: data.value,
                    checked: false,
                    id: data._id,
                    time: String(new Date)
                };
                taskList.unshift(task);
                noteList.prepend(renderTask(task));
            }
            loader.classList.add('displayNone');
        });
    input.value = '';
});

