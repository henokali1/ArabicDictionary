const electron = require('electron');
const path = require('path');
const url = require('url');
var fs = require("fs");

// SET ENV
process.env.NODE_ENV = 'development';
// process.env.NODE_ENV = 'production';

const {app, BrowserWindow, Menu, ipcMain} = electron;

let mainWindow;
let addWindow;

// Listen for app to be ready
app.on('ready', function(){
  // Create new window
  mainWindow = new BrowserWindow({});
  // Load html in window
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'mainWindow.html'),
    protocol: 'file:',
    slashes:true
  }));
  // Quit app when closed
  mainWindow.on('closed', function(){
    app.quit();
  });

  // Build menu from template
  const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
  // Insert menu
  Menu.setApplicationMenu(mainMenu);
});

// Handle add item window
function createAddWindow(){
  addWindow = new BrowserWindow({
    width: 500,
    height:400,
    title:'Add قاموس عربي Item'
  });
  addWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'addWindow.html'),
    protocol: 'file:',
    slashes:true
  }));
  // Handle garbage collection
  addWindow.on('close', function(){
    addWindow = null;
  });
}

function readDb(){
  return JSON.parse(fs.readFileSync('db.json', 'utf8'));
}

function saveDb(d){
  fs.writeFile('db.json', d, function(err) {
      if (err) {
         return alert(err);
      }
      console.log("Data written successfully!");
   });
}

function add(word, meaning){
  obj = readDb()
  obj[word] = meaning
  d = JSON.stringify(obj)
  saveDb(d)
}

function del(obj, word){
  delete obj.word
  return obj
}

function searchWord(word){
  return readDb()[word]
}

// Catch item:add
ipcMain.on('item:add', function(e, item){
  mainWindow.webContents.send('item:add', item);
  data = JSON.parse(item)
  if(data['type'] === 'search'){
    word = data['val']
    meaining = searchWord(word)
    console.log('word', word)
    console.log('Search', word, meaining)
  }
  if(data['type'] === 'add'){
    word = data['word']
    meaining = data['meaining']
    console.log(word, meaining)
    add(word, meaining)
    addWindow.close(); 
  }
  
  
  // Still have a reference to addWindow in memory. Need to reclaim memory (Grabage collection)
  //addWindow = null;
});

// Create menu template
const mainMenuTemplate =  [
  // Each object is a dropdown
  {
    label: 'ملف',
    submenu:[
      // {
      //   label:'أضف كلمة جديدة',
      //   click(){
      //     createAddWindow();
      //   }
      // },
      {
        label:'واضح',
        click(){
          mainWindow.webContents.send('item:clear');
        }
      },
      {
        label: 'خروج',
        accelerator:process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
        click(){
          app.quit();
        }
      }
    ]
  }
];

// If OSX, add empty object to menu
if(process.platform == 'darwin'){
  mainMenuTemplate.unshift({});
}

// Add developer tools option if in dev
if(process.env.NODE_ENV !== 'production'){
  mainMenuTemplate.push({
    label: 'Developer Tools',
    submenu:[
      {
        role: 'reload'
      },
      {
        label: 'Toggle DevTools',
        accelerator:process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
        click(item, focusedWindow){
          focusedWindow.toggleDevTools();
        }
      }
    ]
  });
}