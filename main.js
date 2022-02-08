const wg = new (require('./wordgenerator'))("tr", gameMain);



function gameMain() {
    var word = wg.GetRandomWord();
}