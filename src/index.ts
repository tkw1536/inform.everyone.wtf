class Legal {
    /**
     * Initializes the Legal Script
     * @param globalObject Global Object to register instance under
     */
    static initScript(globalObject: any) {
        const script = document.currentScript;
        if (script === null) {
            debug_fatal('Something went wrong loading the legal script. ');
            debug_fatal('This probably means document.currentScript isn\'t supported by this browser. ');
            debug_fatal('Bailing out. ');
            return;
        }

        globalObject.legal = Legal.fromScriptTag(script as HTMLScriptElement);
        globalObject.legal.run();
    }

    private static readonly STATS_ID_ATTR = 'data-site-id'; // data attribute that the site id should be read from

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

        srcOptions.forEach( option => {
            if (option === '') return; // this is needed when no '?' is included in the url

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
        this.options = shallowClone(options);

        // When we have an element set, turn off the fixed and no border options
        if(this.options.element) {
            this.options.fixed = false;
            this.options.noborder = true;
        }

        // Setup the theme and set the border color to transparent when needed. 
        // Because we modify theme here, we need to clone it. 
        this.theme = shallowClone(this.options.dark ? DARK_THEME : LIGHT_THEME);
        if (this.options.noborder) {
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
        this.element = document.createElement(this.options.element ? 'span' : this.options.small ? 'small' : 'p');
        this.link = document.createElement('a');
        this.optOutElement = document.createElement('span');
        this.setupElementTree();
    }

    //
    // ELEMENT STRUCTURE
    //
    
    private static readonly URL_POLICY = 'https://inform.everyone.wtf';
    private static readonly URL_TITLE = 'my Privacy Policy and Imprint';
    private static readonly URL_TITLE_COOKIES = 'my Privacy Policy, Imprint and Cookie Policy';

    private static readonly TEXT_PREFIX_COOKIES = 'This site makes use of cookies for essential features. ';
    private static readonly TEXT_PREFIX = 'For legal reasons I must link ';
    private static readonly TEXT_SUFFIX = '. ';

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
        this.element.appendChild(this.optOutElement);
        
        // finally append it to the parent
        this.parent.appendChild(this.element);
    }

    //
    // MAIN RUN CODE
    //

    run() {
        // if we have a site-id turn on the tracking script. 
        if(this.options.siteID) {
            this.stats = !this.optout;
        }

        // add the CSS
        this.applyStyle(this.parent);

        onDOMReady(() => {
            if (this.options.element) {
                insertAfter(this.element, this.options.element);
            } else if(this.options.top) {
                document.body.prepend(this.parent);
            } else {
                document.body.appendChild(this.parent)
            }
        });
    }

    private static readonly BORDER_SIZE = '1px';
    private static readonly SMALL_SPACE = '5px';
    private static readonly LARGE_SPACE = '10px'

    /**
     * Applies the caller-selected style to the elements
     * @param parent Parent Element that is inserted into the DOM
     */
    private applyStyle(parent: HTMLElement) {
        if (this.options.element) return; // if we are in element mode, don't apply any styles

        this.element.style.color = this.theme.color;
        this.link.style.color = this.theme.link;


        this.element.style.borderColor = this.theme.border;
        if (this.options.fixed && !this.options.transparent) {
            this.element.style.background = this.theme.background;
        }

        // setup the positioing
        this.element.style.display = 'block';
        
        if (this.options.fixed) {
            this.parent.style.position = 'fixed';
            // align to the right
            this.parent.style.right = Legal.LARGE_SPACE;
            this.element.style.position = 'relative';
            this.element.style.right = Legal.LARGE_SPACE;

            // margin and padding
            this.element.style.border = `${Legal.BORDER_SIZE} solid ${this.theme.border}`;
            this.element.style.padding = Legal.SMALL_SPACE;
            this.element.style.borderRadius = Legal.LARGE_SPACE;

            if (this.options.top) {
                this.parent.style.top = '0px';
            } else {
                this.parent.style.bottom = '0px';
            }
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
            if (this.options.top) {
                this.element.style.borderBottom = `${Legal.BORDER_SIZE} solid ${this.theme.border}`;
            } else {
                this.element.style.borderTop = `${Legal.BORDER_SIZE} solid ${this.theme.border}`;
            }
        }
    }

    //
    // STATS
    //


    private set stats(value: boolean) {
        this.optout = !value;
        this.generateStatsLink(!value);

        if(value) {
            this.loadStatsScript();
        } else {
            this.unloadStatsScript();
        }
    }

    private statsScript?: HTMLScriptElement; // the <script> element that implements tracking

    private static readonly TEXT_OPTOUT_RELOAD_NOW = "Your opt-out has been saved. To complete the opt-out, please reload the page. \n\nClick 'OK' to reload the page now. \nClick 'Cancel' to keep browsing and apply the preference when next reloading the page. ";

    private static readonly ACKEE_SERVER = 'https://track.everyone.wtf'; // server for ackee
    private static readonly ACKEE_SCRIPT = Legal.ACKEE_SERVER + '/tracker.js'; // tracker

    private static readonly TEXT_STATS_ON = 'Opt-Out of Stats';
    private static readonly TEXT_STATS_OFF = 'Undo Opt-Out of Stats';
    private static readonly TEXT_STATS_SUFFIX = '. ';

    private loadStatsScript() {
        if(this.statsScript) return;

        const scriptElement = document.createElement('script');
        scriptElement.setAttribute('data-ackee-server', Legal.ACKEE_SERVER);
        scriptElement.setAttribute('data-ackee-domain-id', this.options.siteID!);
        scriptElement.setAttribute('async', '');
        scriptElement.setAttribute('src', Legal.ACKEE_SCRIPT);
        document.head.appendChild(scriptElement);

        this.statsScript = scriptElement;
    }

    /**
     * Attempt to unload the statistics script
     */
    private unloadStatsScript() {
        // If we didn't load the script, there is nothing to do. 
        if(this.statsScript === undefined) return;

        // With the current method of inclusion it is not actually possible to unload the script. 
        // However there might be any kind of state on the current page, so we inform the user first. 
        if(!confirm(Legal.TEXT_OPTOUT_RELOAD_NOW)) return;
        location.reload()
    }

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
            this.stats = toSetTo;
            return false;
        });
        
        // append the text to the 'extraNode'
        this.optOutElement.innerHTML = "";
        this.optOutElement.appendChild(link);
        this.optOutElement.appendChild(document.createTextNode(Legal.TEXT_STATS_SUFFIX));
    }

    //
    // OPT-OUT STORAGE
    //

    private static readonly STATS_OPT_OUT_KEY = 'wtf.track.everyone.old.photos';
    private static readonly STATS_OPT_OUT_VALUE = WhenYouAccidentallyComment();

    private get optout(): boolean {
        return window.localStorage.getItem(Legal.STATS_OPT_OUT_KEY) === Legal.STATS_OPT_OUT_VALUE;
    }

    private set optout(value: boolean) {
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
    small?: boolean; // use a 'small' instead of a 'p' element
    noborder?: boolean; // don't show a border
    transparent?: boolean; // don't set a background color


    /** position options */
    top?: boolean; // set the banner at the top of the page instead of the bottom
    fixed?: boolean; // use fixed positioning instead of here
    element?: HTMLElement; // append *after* this element, instead of dynamically creating a parent
                           // when set, all of the other styling options (dark, small, noborder, etc) are ignored. 

    /** content options */
    cookies?: boolean; // show the text that we're using cookies
    siteID?: string; // initialize stats code with this site-id
}

const urlOptions = ['dark', 'top', 'fixed', 'cookies', 'noborder', 'small', 'transparent'] as const;
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
    console.warn(...data);
}

/**
 * Prints a fatal error to the error log
 * @param data Data tro print to the error log
 */
function debug_fatal(...data: any) {
    console.error(...data);
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
    return `When in the Course of human events, it becomes necessary for
one people to dissolve the political bands which have connected
them with another, and to assume, among the Powers of the earth,
the separate and equal station to which the Laws of Nature and
of Nature's God entitle them, a decent respect to the opinions
of mankind requires that they should declare the causes which
impel them to the separation.

We hold these truths to be self-evident, that all men are created equal,
that they are endowed by their Creator with certain unalienable Rights,
that among these are Life, Liberty, and the pursuit of Happiness.
That to secure these rights, Governments are instituted among Men,
deriving their just powers from the consent of the governed,
That whenever any Form of Government becomes destructive of these ends,
it is the Right of the People to alter or to abolish it, and to institute
new Government, laying its foundation on such principles and organizing
its powers in such form, as to them shall seem most likely to effect
their Safety and Happiness.  Prudence, indeed, will dictate that Governments
long established should not be changed for light and transient causes;
and accordingly all experience hath shown, that mankind are more disposed
to suffer, while evils are sufferable, than to right themselves by abolishing
the forms to which they are accustomed.  But when a long train of abuses and
usurpations, pursuing invariably the same Object evinces a design to reduce
them under absolute Despotism, it is their right, it is their duty, to throw
off such Government, and to provide new Guards for their future security.
--Such has been the patient sufferance of these Colonies; and such is now
the necessity which constrains them to alter their former Systems of Government.
The history of the present King of Great Britain is a history of repeated
injuries and usurpations, all having in direct object the establishment
of an absolute Tyranny over these States.  To prove this, let Facts
be submitted to a candid world.

He has refused his Assent to Laws, the most wholesome and necessary
for the public good.

He has forbidden his Governors to pass Laws of immediate
and pressing importance, unless suspended in their operation
till his Assent should be obtained; and when so suspended,
he has utterly neglected to attend to them.

He has refused to pass other Laws for the accommodation of
large districts of people, unless those people would relinquish
the right of Representation in the Legislature, a right
inestimable to them and formidable to tyrants only.

He has called together legislative bodies at places unusual,
uncomfortable, and distant from the depository of their
Public Records, for the sole purpose of fatiguing them
into compliance with his measures.

He has dissolved Representative Houses repeatedly, for opposing
with manly firmness his invasions on the rights of the people.

He has refused for a long time, after such dissolutions,
to cause others to be elected; whereby the Legislative Powers,
incapable of Annihilation, have returned to the People at large
for their exercise; the State remaining in the mean time exposed
to all the dangers of invasion from without, and convulsions within.

He has endeavoured to prevent the population of these States;
for that purpose obstructing the Laws of Naturalization of Foreigners;
refusing to pass others to encourage their migration hither,
and raising the conditions of new Appropriations of Lands.

He has obstructed the Administration of Justice, by refusing his Assent
to Laws for establishing Judiciary Powers.

He has made judges dependent on his Will alone, for the tenure
of their offices, and the amount and payment of their salaries.

He has erected a multitude of New Offices, and sent hither swarms of
Officers to harass our People, and eat out their substance.

He has kept among us, in times of peace, Standing Armies
without the Consent of our legislatures.

He has affected to render the Military independent of
and superior to the Civil Power.

He has combined with others to subject us to a jurisdiction
foreign to our constitution, and unacknowledged by our laws;
giving his Assent to their Acts of pretended legislation:

For quartering large bodies of armed troops among us:

For protecting them, by a mock Trial, from Punishment for any Murders
which they should commit on the Inhabitants of these States:

For cutting off our Trade with all parts of the world:

For imposing taxes on us without our Consent:

For depriving us, in many cases, of the benefits of Trial by Jury:

For transporting us beyond Seas to be tried for pretended offences:

For abolishing the free System of English Laws in a neighbouring
Province, establishing therein an Arbitrary government,
and enlarging its Boundaries so as to render it at once
an example and fit instrument for introducing the same
absolute rule into these Colonies:

For taking away our Charters, abolishing our most valuable Laws,
and altering fundamentally the Forms of our Governments:

For suspending our own Legislatures, and declaring themselves
invested with Power to legislate for us in all cases whatsoever.

He has abdicated Government here, by declaring us out of his Protection
and waging War against us.

He has plundered our seas, ravaged our Coasts, burnt our towns,
and destroyed the lives of our people.

He is at this time transporting large armies of foreign mercenaries
to compleat the works of death, desolation and tyranny, already begun
with circumstances of Cruelty & perfidy scarcely paralleled in the
most barbarous ages, and totally unworthy of the Head of a civilized nation.

He has constrained our fellow Citizens taken Captive on the high Seas
to bear Arms against their Country, to become the executioners of
their friends and Brethren, or to fall themselves by their Hands.

He has excited domestic insurrections amongst us, and has
endeavoured to bring on the inhabitants of our frontiers,
the merciless Indian Savages, whose known rule of warfare,
is an undistinguished destruction of all ages, sexes and conditions.

In every stage of these Oppressions We have Petitioned for Redress
in the most humble terms:  Our repeated Petitions have been answered
only by repeated injury.  A Prince, whose character is thus marked
by every act which may define a Tyrant, is unfit to be the ruler
of a free People.

Nor have We been wanting in attention to our Brittish brethren.
We have warned them from time to time of attempts by their
legislature to extend an unwarrantable jurisdiction over us.
We have reminded them of the circumstances of our emigration and
settlement here.  We have appealed to their native justice
and magnanimity, and we have conjured them by the ties of our
common kindred to disavow these usurpations, which would inevitably
interrupt our connections and correspondence.  They too have been
deaf to the voice of justice and of consanguinity.  We must, therefore,
acquiesce in the necessity, which denounces our Separation, and hold them,
as we hold the rest of mankind, Enemies in War, in Peace Friends.

We, therefore, the Representatives of the United States of America,
in General Congress, Assembled, appealing to the Supreme Judge of
the world for the rectitude of our intentions, do, in the Name,
and by the Authority of the good People of these Colonies,
solemnly publish and declare, That these United Colonies are,
and of Right ought to be Free and Independent States;
that they are Absolved from all Allegiance to the British Crown,
and that all political connection between them and the State
of Great Britain, is and ought to be totally dissolved;
and that as Free and Independent States, they have full Power to
levy War, conclude Peace, contract Alliances, establish Commerce,
and to do all other Acts and Things which Independent States may
of right do.  And for the support of this Declaration, with a firm
reliance on the Protection of Divine Providence, we mutually pledge
to each other our Lives, our Fortunes and our sacred Honor.` as const;
}
