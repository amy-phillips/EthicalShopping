
//mmmm copy pasta from https://stackoverflow.com/questions/27194359/javascript-pluralize-a-string
String.prototype.plural = function(revert){

    var plural = {
        '(quiz)$'               : "$1zes",
        '^(ox)$'                : "$1en",
        '([m|l])ouse$'          : "$1ice",
        '(matr|vert|ind)ix|ex$' : "$1ices",
        '(x|ch|ss|sh)$'         : "$1es",
        '([^aeiouy]|qu)y$'      : "$1ies",
        '(hive)$'               : "$1s",
        '(?:([^f])fe|([lr])f)$' : "$1$2ves",
        '(shea|lea|loa|thie)f$' : "$1ves",
        'sis$'                  : "ses",
        '([ti])um$'             : "$1a",
        '(tomat|potat|ech|her|vet)o$': "$1oes",
        '(bu)s$'                : "$1ses",
        '(alias)$'              : "$1es",
        '(octop)us$'            : "$1i",
        '(ax|test)is$'          : "$1es",
        '(us)$'                 : "$1es",
        '([^s]+)$'              : "$1s"
    };

    var singular = {
        '(quiz)zes$'             : "$1",
        '(matr)ices$'            : "$1ix",
        '(vert|ind)ices$'        : "$1ex",
        '^(ox)en$'               : "$1",
        '(alias)es$'             : "$1",
        '(octop|vir)i$'          : "$1us",
        '(cris|ax|test)es$'      : "$1is",
        '(shoe)s$'               : "$1",
        '(o)es$'                 : "$1",
        '(bus)es$'               : "$1",
        '([m|l])ice$'            : "$1ouse",
        '(x|ch|ss|sh)es$'        : "$1",
        '(m)ovies$'              : "$1ovie",
        '(s)eries$'              : "$1eries",
        '([^aeiouy]|qu)ies$'     : "$1y",
        '([lr])ves$'             : "$1f",
        '(tive)s$'               : "$1",
        '(hive)s$'               : "$1",
        '(li|wi|kni)ves$'        : "$1fe",
        '(shea|loa|lea|thie)ves$': "$1f",
        '(^analy)ses$'           : "$1sis",
        '((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$': "$1$2sis",        
        '([ti])a$'               : "$1um",
        '(n)ews$'                : "$1ews",
        '(h|bl)ouses$'           : "$1ouse",
        '(corpse)s$'             : "$1",
        '(us)es$'                : "$1",
        's$'                     : ""
    };

    var irregular = {
        'move'   : 'moves',
        'foot'   : 'feet',
        'goose'  : 'geese',
        'sex'    : 'sexes',
        'child'  : 'children',
        'man'    : 'men',
        'tooth'  : 'teeth',
        'person' : 'people',
        'bean'   : 'beanz', // for heinz
        'spread' : 'spreadable', //yes this is abusing the concept of plurality - sorry not sorry!
        'cereal' : 'muesli',
    };

    var uncountable = [
        'sheep', 
        'fish',
        'deer',
        'moose',
        'series',
        'species',
        'money',
        'rice',
        'information',
        'equipment'
    ];

    // save some time in the case that singular and plural are the same
    if(uncountable.indexOf(this.toLowerCase()) >= 0)
      return String(this);

    // check for irregular forms
    for(word in irregular){

      if(revert){
              var pattern = new RegExp(irregular[word]+'$', 'i');
              var replace = word;
      } else{ var pattern = new RegExp(word+'$', 'i');
              var replace = irregular[word];
      }
      if(pattern.test(this))
        return this.replace(pattern, replace);
    }

    if(revert) var array = singular;
         else  var array = plural;

    // check for matches using regular expressions
    for(reg in array){

      var pattern = new RegExp(reg, 'i');

      if(pattern.test(this))
        return this.replace(pattern, array[reg]);
    }

    return String(this);
}

// matches [a], [o], [a,o] etc
var ETHICAL_CONSUMER_MARKUP = /\[[afgorsv\s]+(?:,[afgorsv\s]+)*\]/gmi;
var PUNCTUATION = /[^\w\s]/gmi;

function pre_process(name) {
    // remove any [a] or [o] etc from ethical consumer
    name=name.replace(ETHICAL_CONSUMER_MARKUP,'');
    // remove accented characters https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript
    name=name.normalize('NFD');
    name=name.replace(PUNCTUATION,'');
    name=name.replace('tinned','');
    name=name.replace('MSC','');
    name=name.trim();
   
    // split into words, make all lowercase, and not plural
    var plurals = name.toLowerCase().split(/\s+/);
    var singles=[];
    for(let word of plurals) {
        singles.push(word.plural(true));
    }
    console.log(name + " becomes:");
    console.log(singles);
    return {"name":name,"words":singles};
}

// get a number between 0 (not at all matchy) and 1 (really quite matchy)
function get_matchiness(name1, name2) {
    matching_word_count=0;
    for(let word1 of name1.words) {
        for(let word2 of name2.words) {
            // do the words match, either exactly or with a trailing s?
            if(word1==word2) {
                matching_word_count++;
                break;
            }

            // todo similarity??
        }
    }
  
    return matching_word_count/Math.min(name1.words.length,name2.words.length);
}
