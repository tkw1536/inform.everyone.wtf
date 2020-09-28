/**
 * LegalConfig is a namespace that acts as the configuration for this script
 */
class LegalConfig {
    protected static readonly URL_POLICY = 'https://inform.everyone.wtf'; // end-user URL for policy
    protected static readonly ACKEE_SERVER = 'https://track.everyone.wtf'; // Server for ackee script. Set to empty string to disable. 
    protected static readonly ACKEE_SCRIPT = LegalConfig.ACKEE_SERVER + '/tracker.js'; // tracker

    // text for cookies, Privacy Policy and things
    protected static readonly TEXT_PREFIX = 'For legal reasons I must link ';
    protected static readonly URL_TITLE = 'my Privacy Policy and Imprint';
    protected static readonly URL_TITLE_COOKIES = 'my Privacy Policy, Imprint and Cookie Policy';
    protected static readonly TEXT_SUFFIX = '. ';

    protected static readonly TEXT_PREFIX_COOKIES = 'This site makes use of cookies for essential features. ';

    // text for opt-out
    protected static readonly TEXT_STATS_ON = 'Opt-Out of Stats';
    protected static readonly TEXT_STATS_OFF = 'Undo Opt-Out of Stats';
    protected static readonly TEXT_STATS_SUFFIX = '. ';
    protected static readonly TEXT_OPTOUT_RELOAD_NOW = "Your opt-out has been saved. To complete the opt-out, please reload the page. \n\nClick 'OK' to reload the page now. \nClick 'Cancel' to keep browsing and apply the preference when next reloading the page. ";

    // attribute to read the 'site-id' from
    protected static readonly STATS_ID_ATTR = 'data-site-id'; // data attribute that the site id should be read from

    // spacing for rendered elements
    protected static readonly BORDER_SIZE = '1px';
    protected static readonly SMALL_SPACE = '5px';
    protected static readonly LARGE_SPACE = '10px';

    // data for opt-out
    protected static readonly STATS_OPT_OUT_KEY = 'wtf.track.everyone.old.photos';
    protected static readonly STATS_OPT_OUT_VALUE = WhenYouAccidentallyComment();
}

class Legal extends LegalConfig {
    /**
     * Initializes the Legal Script
     * @param globalObject Global Object to register instance under
     */
    static initScript(globalObject: any) {
        const script = currentScript();
        if (script === null) {
            debug_fatal('Something went wrong loading the legal script. ');
            debug_fatal('This probably means document.currentScript isn\'t supported by this browser. ');
            debug_fatal('Bailing out. ');
            return;
        }

        globalObject.legal = Legal.fromScriptTag(script as HTMLScriptElement);
        globalObject.legal.run();
    }

    /**
     * Generates a new instance of Legal from a script tag. 
     * @param element <script> element to create instance from
     */
    static fromScriptTag(element: HTMLScriptElement): Legal | null  {

        // Read the src url from the script tag and split it into options. 
        const src = element.getAttribute('src');
        if (typeof src !== 'string') {
            debug_fatal("Missing 'src' attribute of script. ");
            return null;
        }
        const srcOptions = new URL(src, location.href).search.substr(1).split(',');

        // Parse the extracted options into a proper Options Dict. 
        // We only parse non-empty options that are URL settable. 
        // In case of an empty option, we ignore the option. 
        // In case of an unknown option, we log it to the console. 
        const options: LegalOptions = {};

        forEach(srcOptions, option => {
            if (option === '') return;

            if(!isURLSettableOption(option)){
                debug_warn(`Option '${option}' is not known. `);
                return;
            }

            options[option] = true;
        });

        // When the element was loaded without an 'async' attr we should insert it right after this element. 
        if (!element.hasAttribute('async')) {
            options.element = element;
        }

        // When a site id was set (via a data attribute) we set the site id attribute here. 
        const statsSiteId = element.getAttribute(Legal.STATS_ID_ATTR);
        if (statsSiteId) {
            options.siteID = statsSiteId;
        }
        
        // Create the new Legal object from the provided options.
        return new Legal(options);
    }

    private options: LegalOptions; // Options passed by the user
    private theme: Theme; // The theme we're using

    // all of the elements
    private parent: HTMLDivElement;
    private element: HTMLElement;
    private link: HTMLAnchorElement;
    private optOutElement: HTMLSpanElement;
    
    /**
     * Creates a new instance of Legal
     * @param options Options to be passed
     */
    constructor(options: LegalOptions) {
        super();
        this.options = shallowClone(options);

        // Setup the theme and set the border color to transparent when needed. 
        // Because we modify theme here, we need to clone it. 
        this.theme = shallowClone(this.options.dark ? DARK_THEME : LIGHT_THEME);
        if (!this.options.float) {
            this.theme.border = 'transparent';
        }

        // When we have an element set, turn off the fixed and no border options
        if(this.options.element) {
            this.options.float = true;
            this.theme.border = 'transparent';
        }



        // If the user can not opt-out disable statistics to be safe. 
        // That way you can't say the user could not opt out. 
        if (!window.localStorage && this.options.siteID) {
            debug_warn('Local Storage is not supported by this Browser. ');
            debug_warn('Assuming that the user has opted out statistics to be safe. ');
            delete this.options.siteID;
        }

        this.parent = document.createElement('div');
        this.element = document.createElement(this.options.element ? 'span' : 'small');
        this.link = document.createElement('a');
        this.optOutElement = document.createElement('span');
        this.setupElementTree();
    }

    //
    // ELEMENT STRUCTURE
    //

    /** Sets up the structure of elements on the page */
    private setupElementTree() {

        // Setup the <a> element
        this.link.setAttribute('href', Legal.URL_POLICY);
        this.link.setAttribute('target', '_blank');
        this.link.appendChild(
            document.createTextNode(
                this.options.cookies ? Legal.URL_TITLE_COOKIES : Legal.URL_TITLE)
        );

        // Setup the element itself
        this.element.appendChild(document.createTextNode(
            (this.options.cookies ? Legal.TEXT_PREFIX_COOKIES : '') +
            Legal.TEXT_PREFIX,
        ));
        this.element.appendChild(this.link);
        this.element.appendChild(document.createTextNode(Legal.TEXT_SUFFIX));

        if (Legal.ACKEE_SERVER) {
            this.element.appendChild(this.optOutElement);
        }
        
        // finally append it to the parent
        this.parent.appendChild(this.element);
    }

    //
    // MAIN RUN CODE
    //

    run() {
        // if we have a site-id turn on the tracking script. 
        if(this.options.siteID && Legal.ACKEE_SERVER) {
            this.setStats(!this.getOptout());
        }

        // add the CSS
        this.applyStyle();

        onDOMReady(() => {
            if (this.options.element) {
                insertAfter(this.element, this.options.element);
            } else {
                document.body.appendChild(this.parent)
            }
        });
    }

    /**
     * Applies the caller-selected style to the elements
     * @param parent Parent Element that is inserted into the DOM
     */
    private applyStyle() {
        if (this.options.element) return; // if we are in element mode, don't apply any styles

        this.element.style.color = this.theme.color;
        this.link.style.color = this.theme.link;

        this.element.style.borderColor = this.theme.border;
        if (!this.options.float) {
            this.element.style.background = this.theme.background;
        }

        // setup the positioing
        this.element.style.display = 'block';
        
        if (!this.options.float) {
            this.parent.style.position = 'fixed';
            // align to the right
            this.parent.style.right = Legal.LARGE_SPACE;
            this.element.style.position = 'relative';
            this.element.style.right = Legal.LARGE_SPACE;

            // margin and padding
            this.element.style.border = `${Legal.BORDER_SIZE} solid ${this.theme.border}`;
            this.element.style.padding = Legal.SMALL_SPACE;
            this.element.style.borderRadius = Legal.LARGE_SPACE;

            this.parent.style.bottom = '0px';
        } else {
            // align to the right
            this.element.style.textAlign = 'right';

            // hide overflow on the parent
            this.parent.style.margin = '0';
            this.parent.style.padding = '0';
            this.parent.style.overflow = 'none';
            this.parent.style.width = '100%';

            // no margin, and proper padding
            this.element.style.margin = '0';
            this.element.style.paddingTop = Legal.SMALL_SPACE;
            this.element.style.paddingBottom = Legal.SMALL_SPACE;
            this.element.style.paddingRight = Legal.LARGE_SPACE;

            // border in the right place
            this.element.style.borderTop = `${Legal.BORDER_SIZE} solid ${this.theme.border}`;
        }
    }

    //
    // STATS
    //

    /**
     * set stats sets up the statistics script to to toggle on or off
     */
    private setStats(value: boolean) {
        this.setOptout(!value);
        this.generateStatsLink(!value);

        if(value) {
            this.loadStatsScript();
        } else {
            this.unloadStatsScript();
        }
    }

    private statsScript?: HTMLScriptElement; // the <script> element that implements tracking

    /**
     * load the statistics script
     */
    private loadStatsScript() {
        if(this.statsScript || !Legal.ACKEE_SERVER) return;

        const scriptElement = document.createElement('script');
        scriptElement.setAttribute('data-ackee-server', Legal.ACKEE_SERVER);
        scriptElement.setAttribute('data-ackee-domain-id', this.options.siteID!);
        scriptElement.setAttribute('async', '');
        scriptElement.setAttribute('src', Legal.ACKEE_SCRIPT);
        document.head.appendChild(scriptElement);

        this.statsScript = scriptElement;
    }

    /**
     * Unload the statistics script
     */
    private unloadStatsScript() {
        // If we didn't load the script, there is nothing to do. 
        if(this.statsScript === undefined) return;

        // With the current method of inclusion it is not actually possible to unload the script.
        // We need to reload the page first. 
        // However there might be any kind of state on the current page, so we inform the user first. 
        if(!confirm(Legal.TEXT_OPTOUT_RELOAD_NOW)) return;
        location.reload()
    }

    /**
     * generateStatsLink sets the stats link to update the state to toSetTo
     */
    private generateStatsLink(toSetTo: boolean) {
        this.optOutElement.innerHTML = "";

        // create a link to (undo) opt-out
        const link = document.createElement('a');
        link.setAttribute('href', "javascript:void");
        if (!this.options.element) {
            link.style.color = this.theme.link;
        }
        link.appendChild(document.createTextNode(toSetTo ? Legal.TEXT_STATS_OFF : Legal.TEXT_STATS_ON));
        link.addEventListener('click', (e: MouseEvent) => {
            e.preventDefault();
            this.setStats(toSetTo);
            return false;
        });
        
        // append the text to the 'extraNode'
        this.optOutElement.innerHTML = "";
        this.optOutElement.appendChild(link);
        this.optOutElement.appendChild(document.createTextNode(Legal.TEXT_STATS_SUFFIX));
    }


    /**
     * getOptOut gets the optOutState
     */
    private getOptout(): boolean {
        return window.localStorage.getItem(Legal.STATS_OPT_OUT_KEY) === Legal.STATS_OPT_OUT_VALUE;
    }

    /**
     * setOptOut gets the optOutState
     * @param value 
     */
    private setOptout(value: boolean) {
        if(value) {
            window.localStorage.setItem(Legal.STATS_OPT_OUT_KEY, Legal.STATS_OPT_OUT_VALUE);
        } else {
            window.localStorage.removeItem(Legal.STATS_OPT_OUT_KEY);
        }
    }

}

//
// OPTIONS
//

interface LegalOptions {
    /** color options */
    dark?: boolean; // use a dark theme instead of a light one

    /** position options */
    float?: boolean; // use 'float:right' instead of fixed positioning
    element?: HTMLElement; // append *after* this element, instead of dynamically creating a parent
                           // when set, all of the other styling options (dark, small, noborder, etc) are ignored. 

    /** content options */
    cookies?: boolean; // show the text that we're using cookies
    siteID?: string; // initialize stats code with this site-id
}

const urlOptions = ['cookies', 'dark', 'float'] as const;
type ArrayElement<A> = A extends readonly (infer T)[] ? T : never
type URLSettableOption = ArrayElement<typeof urlOptions>;

/**
 * Checks if a string is of type URLSettableOption
 */
function isURLSettableOption(option: string): option is URLSettableOption {
    for (const value of urlOptions)
        if (value === option) return true;
    return false;
}

//
// THEMING
//

interface Theme {
    color: string;
    background: string;
    border: string;
    link: string; 
}

const LIGHT_THEME: Theme = {
    color: 'black',
    background: 'white',
    border: 'black',
    link: 'blue',
}

const DARK_THEME: Theme = {
    color: 'white',
    background: 'black',
    border: 'white',
    link: 'blue',
}

//
// UTILITY FUNCTIONS
//

/**
 * Prints a warning to the warning log
 * @param data Data to print to the debug log
 */
function debug_warn(...data: any) {
    if (!(console && console.warn)) return;
    console.warn(...data);
}

/**
 * Prints a fatal error to the error log
 * @param data Data tro print to the error log
 */
function debug_fatal(...data: any) {
    if (!(console && console.error)) return;
    console.error(...data);
}

/**
 * Foreach runs a fyunction for each element of an array
 */
function forEach<T>(ary: T[], f: (e: T) => void) {
    if (typeof ary.forEach === 'function')
        return ary.forEach(f)

    for(let i = 0; i < ary.length; i++) {
        f(ary[i]);
    }
}

/** currentScript returns the current script that is being executed */
function currentScript(): HTMLScriptElement | SVGScriptElement | null {
    const script = document.currentScript;
    if (script !== null) {
        return script;
    }

    const scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1];
}

/**
 * Makes a shallow clone of an object, that is it copies each own property of original into a new object clone. 
 * @param original Object to clone. 
 */
function shallowClone<T extends Record<string, any>>(original: T): T {
    const clone: {[key: string]: any} = {};
    for (const key in original) {
        if (!original.hasOwnProperty(key)) continue;
        clone[key] = original[key];
    }
    return clone as T;
}

/**
 * OnDOMReady runs code when the DOM becomes available on the current document. 
 * If the DOM is already available, runs code immediatly. 
 * @param code Code to run
 */
function onDOMReady(code: () => void) {
    const state = document.readyState;
    if (state === "complete" || state === "interactive") {
        return code();
    }
    window.addEventListener('DOMContentLoaded', code);
}

/**
 * Insert an element right after a provided element
 * @param element New element to insert
 * @param after Element to insert after
 */
function insertAfter(element: HTMLElement, after: HTMLElement) {
    const parentNode = after.parentElement;
    if (parentNode === null) {
        throw new Error("after.parentElement is null");
    }

    const sibling = after.nextSibling;
    if(sibling !== null) {
        parentNode.insertBefore(element, sibling);
    } else {
        parentNode.appendChild(element);
    }
}

//
// Initialization Code
//

Legal.initScript(window);

//
// Text Resources
//

function WhenYouAccidentallyComment() { // THE ENTIRE DECLARATION OF INDEPENDENCE
    return function(o){for(var r,t,e=o[0],n:{[v:number]:string}={},u=[e],h=e,a=256,c=1;c<o.length;c++)r=(t=o.charCodeAt(c))<256?o[c]:n[t]?n[t]:h+e,u.push(r),e=r.charAt(0),n[a]=h+e,a++,h=r;return decodeURIComponent(escape(u.join("")))}("When iătā Course of humaăevĂts,Ąt becomes nģħsary for\noĪ peoplďto dissolĚ ćďpņiticalġėdĨwhŐhēaňĤnĪcted\nŊm wŎśėoŊrĞŕŉŀańĕeűmĶgŉĈPowečĐĒŊ eĮć,ŦĈĎpĮaţ ŲequŒ stƑiĶųũřcśƆLawĨđ NƑČďŕĵĒƫtƭ'ĨGodƇnŏtĽŽeműŁīƻ rħĹŢƟƆĻąƝnsư ĖnkąƹǇƖiǇĨćƑƿİshċlƹdģlĮľĈőuĎŗơh\nimĹœŧǋƍeƏrƜĶ.\n\nWďǣǥƿĎŉrućǝŀĢƙelf-ęiǧƻĞǞĠŒœĦăǪ cǇƑŤƇƖŒƋȚǠƓǇƺdƀȥbİŊǛĉȣĿrũūȡƂƛą unŒiĂabƾRighĜȩhǟaźnżŊȈȠLifŸ ɘĢrtyűnƹƆpČsuŎƄ HappąĬȀTɏĠĿȐcƭȇďrɊɌĝ ƷĚrnȞĜȬďąƚŎȋȥɑŻ MĂƋǧɽvąɔāȵjǮĠŌƁƃfrĥƿȡĶĎǅƩƆgoʃĪdƋɴǟŘĂęƂƓnİFĳŨƩʂƂʅěġģĥħǃƚȊŢiňʪāȈĂŖƋɪŃʥɉɋĠˍďPĺļľŴlţȹĳƟɆōǢğɢɤŀʊƼʍ\nĪwʁʭˀʆĞǩyʘğĨĲɁdǾăƞɨƢĸɽnci˝ĨŲĳgėizʘǳʇʟƂĨȿ̂śĲrǁƓȍƿŨǢȜȐǀǓoƚ likȑȳŀefɚŢƌeȵSaɚɠʸƹɭɯɱń.  PȊȗcɛǗeŤĞŪlœłŢȤŽǟʿʄʆǑlʐħƛɇŃāƹǢǤƹnŮ˃ȡɏɓȥ̨̚ɾțɣȉėsɄǅǭǯ;\nŲacĤrłɓlİ̢exĹɽĂ͆ŜćƙǣwnșɵǓėǖͮȠźȭłsŌĎťɷɨ̰Ƃ͋řƾȕl̊ȭΝɚǽɇɛǞĆŀɽ˗̟ĎŇˆȲƓb˦řɓ̳ıʼ̞ŘŚȫȠ͹ɹƚ˅d̀ BȋƠĂƓ̨ʐtǽȿƩɆǮˆƯǮČƏŏʧĞɦčɩɓĄnvĮiɆͿʥĭĦ ObjģĠȕ̆ϗˇɊέǆŤu̳͆Ũ˽ʷɆŅlʍ DǈŮŃ̜˓ǝʚȹίɌĞЋƿȵdȋɡǹʣwưĒ̘˲ʮ˵̺Ɵpʣʗǧĩe˱GƗͼ˻ˣȴȹfȋɺĎɹɽɠȀ--SϻśɏĨĢύɥƜ˂ΧƂė·˙ȈĊ͘nɄs;СН˔ͣКƆšĬŎİο̃şˈaʊ̟ˤˠʷЯμ̛ʷSyƚǀƨĒ͔ˁƻɳĈřυįɫɥǜ˂K˹ʾȷωжџă˔aēŃȸİƩǇĹȤťąʜ΅̊ͮϙrϛǏʀ̢ɏʗϢȿłǇǊoϯϱʥ͚Ϩ͝ʆǒėζЂЄTyǽŠ҈ʃɻ SƛţsψTŀУ˳ŽŃ˶eĠF͹Ĝ\nȏɨbmŎţ˪ώőɣȖũĳǥȀ\nHȄŵϹбΚ҅ĨAń˂ɷƥƧΎďź̧Řņħ˅СїńĮy\nͪɥu͜c ʬƸӕӗŜЭrbȖȗӝОˀĳ̞ƏńɜƦѭĄmĦłȤͷͮУјқǵĳƛϴĞɁĽԉɨΘːȥȿѥĻцϜnŦi͍ԃӟʨĠ͠uȆȏҠȾʯѐŲʴăŅƙǮĹɣ͊\nѳәȋˡϩĪgĽŢȥɷƑţͮɷŧӻӘĨǇӛՋһŵƨůԊƧѦʥσĥź˾ԧƄ\nǩrgďΗϑŐʇƩĹĻĽԛnԝЌ̦ŋ˜ƾw͡Ϲ̩nǚǢλЏ˘ĒRǻѹƻ˿ϣʥLegŃǩƳǇǂփǳĪʋĖΪǹ̤Ų̚ӊ˾֚ՐҮėծմyՒӽȡȜ՗թ՛Ľ֏s֑ˋďηłϗʞǩ͆ĨɁϙȨ\nɁĤm͛̚ղСի֤ıʣŨƆǧΙŎĳ҈ƅЍ\nPӵ̩ӷֆͻˑ՞ƆЂŋϚշɫfƜgϡʙǀ֖ɷׁļϧϴȺΉѴǓƈɨǜ֨оŁŃЂĚƹֆԔԮƜňHċǯϹҋӌͿĞͪĻ׎κŪΉǔϩfǛm֗ĨױąϥͱʧĐĆĈփԌɥչe׶әՕϖƹͪ҄ьɔǴɛ̷ˡԼ̃ΗҫԧĝŦŀʹďŮāƃɷȏȑϱŤѐʴǇεƤ֎֐؀˚Ȱč˒̆ɮϨغĒAŠiΡ˿ĞҙɼӁČʯ֛͂آƓĠէթӲЮЍƇxƂ̇ĎѐƆҵ͑ǇĖǎқ؝ӦƈĆح٩ΙŤطƓԫ׌ėթƃƩؘŵǏ׉ʤ؎ǣȋ˩ʦϤԱؚǐׯιؤĨԡŝċǇӍԔĚǅɥĻԱ֊щďٰҷͶӳΏϟټĐbˈϻŏϢƤԋɫƲČɃzڣĒʻǇϷ̕Ͷئͱڲ՘ԉػ̕ƟΆښaթГȹӊgǽդřůƋŲϒۂקڏłصɫ˰ AɯʣУϧۜƩƥɣҸȁӼ׷ҠگՊɤĈAdӊэўդƩJʝŐɛεہ˹ױԭěپӣӾƇƚҥǢ˹۹͏ϧѶſʠ۩ӖՓΐЦʜdթĨ׍ԡʩăױWԪœŒĶɛکľĂƭǒԤ̰ۻҗՏĈʏɁͭƹƏyʆѷ٨ĭէюږƇҞӌώmԱ˭ЦƩNШϭܫֺڎԮ҅՛swĮmѭ\nO݉ۇɷɏǽۅČ٠ձخͮƈ˘ϋѥӈ܇ϴܼ̫pțɒżǮБٹĦԌҋ͆ĞٰӐϢA̛ю\nڋċɶĈĊǐ˂Ʃښ̨وֱƬ׵۪ܓ̷̱ܿɷǇԿȹƆMԪŎӰϣܚԿʩfԒ͟u΄ƝޓŀƆCˋԪׁٌܼ͂ԀٞڋĐů̞ӈϰǊǮˤ ҏŃ͏ԧ٦ڽgϸޅѝ˭ԧڎɁ͹kєĽܗȱ҈ݜǩƧͶ֏Қż܀Ӡڟޤ٨AŢݲǇՎǧƹ֯ىԧ:ȁڼ ȧɟƂ˹٤ִƸюɫݑՋʣĻ̊ݬɀsߤ\nߦҼţˊڲā̜ε҄źck TɽȨډŨו۵hܶةʹʑČʕǑћƣāǡڌȆׁӊ˘ٶ InɏԀԙծגħڥҶħ߹ߦɹtڱżđĒޅࠈaЦޯ̢Ǽࠧʥջrǥ࠭ˣǴ،ɔa٪ƨă޶ݽϋޅށԮࡁȹ׍ʖ˹ݮ֋ǔİőǯĞ˙˃Īؒ࠼ࠈϧœε۹įࡐͯǐŌɟࡔпeyĶƹS׳ƟȏլͩˣԔߞȥ࠳Άࠬߥˣ˥̩܉߿ďʢ͉ҴѪţʽĒE;͝՜̖ȟЧɾηČ̑̓ʭąݴ܆ׄ͝˹ů̴ȟăݹࠥǽѶʬПěەݠմĮ֏қʇBċɣϦˆԻәސԡȹɪǟĶϼҩ΂ɑ˝С࡟ϣگࠐࡂƻʣЕ̇ࢄƙɑeͷڮņЄȊƾąՐˎďыĶюࡧƛΒżƦaߍȹCݙˡҗηࢂι࠲ݜӧĠϥЃّ࢐ࢫƹŒˡ˹бࢴʆȜȳĈڼݒɫޅѯ͖ࡧԟԾͽ࣮ˢΌɜއ֑ƭܭǦǨϦࢄݒȑĚǑؘ͚ȥޯ܏Ѥŀߡވƒͪ޶ȿ̢࡙ˆŘƑŅʶrܼɆ͏ҌԄ͕˂ؼۼİǧcܺϢ޶ݾɫױ߽࢘޼Ըۋ˹WĮƓ̍ˬ߷ܼļϿڛĐݜĎŵĞǽϥթƹࡍoŵɍġٝݢޣΌضŲǧˈoyՋĈ̩ङःݜհ˝֨҃ݿ˔ŏϬϑͰࡪ࠱̨ࢮƮݺˆƩ̴̚޿ײr͆ɂҐپ׫ĽǟƆ࠾kԌǧƑhĞ०ņ֊ŲɠүʹűlȣdİĢץԨޯ̇আĕݦֺɫCȊȑ̹&ĸƂؒঠƙőআ̬ĸƐ͍ـƹԣā\nࣰŔӿĮ؃ॊħڎĿƛ͍İɁ࠾ćבʥӗ࠷߰ȡާ̩zȥɂԧޫʧॸɱग़ݜɚ͍ƀĉŎ̏Ăǝa̫ăCɮŏˌࠠřɋҴ׳پĢॉݹंۋҁ̧ѥĊܱįșȎ˄ॷĈ΂ģȋǏۇđ̳ȵʢͲŖСBߝhޑ࡛ޣı̢ŧβ७ن٨ɭܼۨ΂̇ܿȯݱŏӷʊČܾҖƓݬ̧ࡕŲо\nژvښ՗ġ̅࠲ࠠąࠤޗƻԌޅʢĶŏ̕ɎٷআԪĬࠡӐҩ̶क़েƠס߈ƀăْࣖũĮף֓ǳґɀӐʋɓɩǢȥ०ϑڰڈϔԫۋੑĎࡇСşۛҖӕࠢƇʃǡƛیڤϭۡј؛ȃŜň˛ƼਊبˣֆdǜचࠠুĔm֡Ƃݒ:́OݜҊݡȥઃ০؛ٚ˃ύͰʠٽĶϩ۽ǻઘঽnҏ֧́A࢛͂̅өȈƢƐՊࢻЌ޶Ėr̫ťεम΀Ǌࠗΐह̯ɱώҭүtБֻnࣅؾǫɼԱƂҨ׉ࢇ˛ݞӕNˣઝ઀рăݐƻ˹ध࠰ěڈɷޅਓӋ࢏bਔޑȀ઀ઝݐʄ४̤੃׋ٺՐٺϔૣǵʇਞ̴Ĵढऐȭɷ΂ߞʸ੟૱ૈࣴ޹s޻੩ҲǮ૮Әňٲ͈۰̤࡜দɹݒԙপބݜǀɊۑڈƯĎ࠰Ľܶषψ૯ŝƮɯƈߊ֛ȵ৚ֳ޸ۺࢿͮĖ޿̎ࠞЗԸଓďşҏ૳Ũ૾ŉ߯ଟĴࠝƞΒઉਸΗڙ˱ɕďғҕϝƠπջԱનȕׄӱࣘƂȊݪ॒ȹşšۜŲͻǜŌޛ͆ҹ࠙ųŀઝ૝\n঒ƅߘďਸ਼ۻɫʜʋ·̋ĒѝڂϡљଫӦʝӥՕĳŸͷcǚħ·াďӮͱɠΠπȗࢳଞݜࡲǼ٘СȅଗǁͷŗȄņଗϹ̧Ʃǔ୍ĞࢍଡˆȿैŰ֋˛͹ďF΅ਡȁȃஉ̯஋ӥ ׽ֈҶֳؠĈUэܿڦঀٓĦɽőَʁʵǽœށېĬĞ܁એߊűଯɃۃʥлԔϬ܋੺ޝ঎ӓઆޓ؞ϱʌ݄࠴ݜୠૠୗȯݯʥƫĦࣶġࣿďAȋǣж৐ʫoƸݝࣃ੻ࣜэে\nמؔϩɦ͜˧॥औ֓ࠇΏ୓ ௉Ŏȥఊ߯Ǫ௻Ʃ˖Ɍ॒ΰ૎ ஹࢇŲࠢޚȗĠௌяƌ঍୰ȠA࣓γب׊ٿœA঻֏ч˞ʥ૨ŏ˧ব੕௻Ȫ࠺ōਨƘ୦௮ƞĢtƁсࠀСٯࠫǒGѾృҁ૊Сċదਃų৊ϩسņ׻ͶঙΏә఩ƮͮబદޛయࠫʀŊİઝбԫटޣզęİளĞşऻuЦஶ࢛şॸǊఽ̩ీʀҤఒśĊԎ٫஌ঙŀȯ఻ްؼ۟ߛСɴʘǰπ౰उ˂రૂǒփŁoψٔ௫Ϫޠॺܷ˔ІऻƐ߄ڔώ̛ؒ\nǇಌ׮ƞƆू౏̀ĒDާķ࢘Хࡽ͋இƳࣾĸߊ٥଄͹śۆˢݜɘङ࡛ݜڼƳ֗౟॓͹॑؂ͣय");
}
