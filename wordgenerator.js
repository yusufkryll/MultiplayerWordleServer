const fs = require('fs');
module.exports = class WordGenerator {
    constructor(language = "tr", callback) {
        this.dir = __dirname + "/words/words-" + language + ".txt";
        this.allWords = null;
        var that = this;
        fs.readFile(this.dir, "utf8", function(err, data) {
            if(err) 
            {
                console.log(err);
                return;
            }
            data = data.toLowerCase();
            that.allWords = data.split("\n");
            callback();
        })
    }
    GetRandomWord() {
        function randomElement(items)
        {
            return items[Math.floor(Math.random()*items.length)];
        }
        let result = randomElement(this.allWords);    
        console.log(result);
        return result;
    }
}