var fs = require("fs");

fs.symlink("./tests","./new-port",(err)=>{
    console.log(1);
})