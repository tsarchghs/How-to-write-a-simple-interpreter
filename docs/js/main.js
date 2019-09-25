var util = util || {};
util.toArray = function(list) {
   return Array.prototype.slice.call(list || [], 0);
};

var Terminal = Terminal || function(cmdLineContainer, outputContainer,interpreter) {
   window.URL = window.URL || window.webkitURL;
   window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

   var cmdLine_ = document.querySelector(cmdLineContainer);
   var output_ = document.querySelector(outputContainer);

   var fs_ = null;
   var cwd_ = null;
   var history_ = [];
   var histpos_ = 0;
   var histtemp_ = 0;

   window.addEventListener('click', function(e) {
      cmdLine_.focus();
   }, false);

   cmdLine_.addEventListener('click', inputTextClick_, false);
   cmdLine_.addEventListener('keydown', historyHandler_, false);
   cmdLine_.addEventListener('keydown', processNewCommand_, false);

   //
   function inputTextClick_(e) {
      this.value = this.value;
   }

   //
   function historyHandler_(e) {
      if (history_.length) {
         if (e.keyCode == 38 || e.keyCode == 40) {
            if (history_[histpos_]) {
               history_[histpos_] = this.value;
            } else {
               histtemp_ = this.value;
            }
         }

         if (e.keyCode == 38) { // up
            histpos_--;
            if (histpos_ < 0) {
               histpos_ = 0;
            }
         } else if (e.keyCode == 40) { // down
            histpos_++;
            if (histpos_ > history_.length) {
               histpos_ = history_.length;
            }
         }

         if (e.keyCode == 38 || e.keyCode == 40) {
            this.value = history_[histpos_] ? history_[histpos_] : histtemp_;
            this.value = this.value; // Sets cursor to end of input.
         }
      }
   }

   //
   function processNewCommand_(e) {

      if (e.keyCode == 9) { // tab
         e.preventDefault();
         // Implement tab suggest.
      } else if (e.keyCode == 13) { // enter
         // Save shell history.
         if (this.value) {
            history_[history_.length] = this.value;
            histpos_ = history_.length;
         }

         // Duplicate current input and append to output section.
         var line = this.parentNode.parentNode.cloneNode(true);
         line.removeAttribute('id')
         line.classList.add('line');
         var input = line.querySelector('input.cmdline');
         input.autofocus = false;
         input.readOnly = true;
         output_.appendChild(line);

         execCMD(this.value, []);

         window.scrollTo(0, getDocHeight_());
         this.value = ''; // Clear/setup line for next input.
      }
   }

   //
   function formatColumns_(entries) {
      var maxName = entries[0].name;
      util.toArray(entries).forEach(function(entry, i) {
         if (entry.name.length > maxName.length) {
            maxName = entry.name;
         }
      });

      var height = entries.length <= 3 ?
          'height: ' + (entries.length * 15) + 'px;' : '';

      // 12px monospace font yields ~7px screen width.
      var colWidth = maxName.length * 7;

      return ['<div class="ls-files" style="-webkit-column-width:',
              colWidth, 'px;', height, '">'];
   }

   //
   function output(html) {
      output_.insertAdjacentHTML('beforeEnd', '<p>' + html + '</p>');
   }

   // Cross-browser impl to get document's height.
   function getDocHeight_() {
      var d = document;
      return Math.max(
         Math.max(d.body.scrollHeight, d.documentElement.scrollHeight),
         Math.max(d.body.offsetHeight, d.documentElement.offsetHeight),
         Math.max(d.body.clientHeight, d.documentElement.clientHeight)
      );
   }

   function execCMD(cmd, args){
       if (cmd === "help"){
           output('<div class="">' + `
           <p>
               digit ::= "0" | "1" | "2" | "3" | ... | "9"</br> 
               number ::= digit | digit number</br>
               operator ::= "+", "-", "/", "*"</br>
               numberOrOperation ::= number | operation</br>
               operation ::= "(" operator numberOrOperation numberOrOperation ")"</br>
               expression ::= number | operation</br>
           </p>
               </br>
               123;</br>
               123;1;</br>
               (+ 1 2);</br>
               (+ 1 (/ (* 2 3) 4));</br>
               (+(-(-5 2)(/(-5 2)(-5 2)))(-(-5 2)(/(-5 2)(-5 2))));</br>
           ` + '</div>');     
     } else if (cmd === "credits"){
        output(`<div class="">
        Look and feel: https://codepen.io/rafael-casachi/pen/qLEeJV?page=3</br>
        Interpreter implementation: <a style="color: white;" target="_blank" href="https://github.com/gjergjk71">Gjergj Kadriu</a> 
        </div>`)
     } else {
         let result = interpreter.run(cmd);
         output(`<div class="">${result}</div>`)
     }
   }

   //
   return {
      init: function() {
           output('<h2>Interpreter</h2><p>' + new Date() + '</p>Want to implement this interpreter? <a style="color: white;" target="_blank" href="https://thecodingaddict.wordpress.com/2019/09/22/how-to-write-a-simple-interpreter/">Blog Post</a><p>Enter "help" for more information.</br>Enter "credits" for credits.</p>');
      },
      output: output
   }
};

document.getElementsByClassName("prompt")[0].innerHTML = ">>> ";
var inter = new Interpreter();
var term = new Terminal('#input-line .cmdline', '#wrapper output', inter);
term.init();
