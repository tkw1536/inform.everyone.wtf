interface LegalOptions {
    /** Use a dark instead of a light theme */
    dark?: boolean;

    /** Align the banner to the top of the page instead of the bottom */
    top?: boolean;

    /** Use fixed positioning */
    fixed?: boolean;

    /** don't show a border */
    noborder?: boolean;

    /** use a small instead of a p */
    small?: boolean;

    /** show the text that we use cookies */
    cookies?: boolean;

    /** if non-empty intialize the statistics code */
    siteID?: string;
}

type URLSettableOption = Exclude<keyof LegalOptions, 'siteID'>;
const knownOptions = ['dark', 'top', 'fixed', 'cookies', 'noborder', 'small'];
function isURLSettableOption(option: string): option is URLSettableOption {
    return knownOptions.indexOf(option) !== -1;
}


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

function onDOMReady(callback: () => void) {
    const state = document.readyState;
    if (state === "complete" || state === "interactive") {
        callback();
        return;
    }
    window.addEventListener('DOMContentLoaded', callback);
}


class Legal {
    private options: LegalOptions;
    
    /**
     * Creates a new Legal
     * @param options Options to be passed
     */
    constructor(options: LegalOptions) {
        this.options = options;
        this.theme = this.options.dark ? DARK_THEME : LIGHT_THEME;
        if (this.options.noborder) {
            this.theme.border = 'transparent';
        }

        // If the user can not opt-out disable statistics to be safe. 
        // That way you can't say the user could not opt out. 
        if (!window.localStorage && this.options.siteID) {
            console.warn('Local Storage is not supported by this Browser. ');
            console.warn('Assuming that the user has opted out statistics to be safe. ');
            delete this.options.siteID;
        }

    }

    private theme: Theme;

    //
    // TEXT RESOURCES
    //

    private static readonly TEXT_PREFIX_COOKIES = 'This site makes use of cookies for essential features. ';
    private static readonly TEXT_PREFIX = 'For legal reasons I must link ';

    private static readonly URL_POLICY = 'https://inform.everyone.wtf';
    private static readonly URL_TITLE = 'my Privacy Policy and Imprint';
    private static readonly URL_TITLE_COOKIES = 'my Privacy Policy, Imprint and Cookie Policy';

    private static readonly TEXT_SUFFIX = '. ';

    private static readonly TEXT_STATS_ON = 'Opt-Out of Stats';
    private static readonly TEXT_STATS_OFF = 'Undo Opt-Out of Stats';
    private static readonly TEXT_STATS_SUFFIX = '. ';


    //
    // STYLE SIZES
    //
    private static readonly BORDER_SIZE = '1px'
    private static readonly SMALL_SPACE = '5px'
    private static readonly LARGE_SPACE = '10px'


    // node to store extra text in
    private extraNode = document.createElement('span');
    /**
     * Generates a new instance of LegalNagBar from a script tag. 
     * @param element <script> element to create instance from
     */
    static fromScriptTag(element: HTMLScriptElement): Legal | null  {

        // read the 'src=' part of the url
        const src = element.getAttribute('src');
        if (typeof src !== 'string') {
            console.error('Invalid script tag: Must be using \'src\' attribute and not be inline. ');
            return null;
        }

        // get the search part of the url
        const searchURL = new URL(src, location.href).search.substr(1);

        // parse all string options
        const options: LegalOptions = {};
        if (searchURL !== '') {
            searchURL.split(',').forEach( option => {
                if(isURLSettableOption(option)){
                    options[option] = true;
                } else {
                    console.warn(`Option '${option}' is not known. `);
                }
            });
        }

        // if we have a site id, set it too
        const statsSiteId = element.getAttribute(Legal.STATS_ID_ATTR);
        if (!!statsSiteId)
            options.siteID = statsSiteId;
        
        // and make an instance
        return new Legal(options);
    }

    run() {
        // create the element structure

        const preText = document.createTextNode(
            (this.options.cookies ? Legal.TEXT_PREFIX_COOKIES : '') +
            Legal.TEXT_PREFIX,
        );
        
        const link = document.createElement('a');
        link.setAttribute('href', Legal.URL_POLICY);
        link.setAttribute('target', '_blank');
        link.appendChild(
            document.createTextNode(
                this.options.cookies ? Legal.URL_TITLE_COOKIES : Legal.URL_TITLE)
        );

        const postText = document.createTextNode(Legal.TEXT_SUFFIX);
        
        // add the element to the page
        const element = document.createElement(this.options.small ? 'small' : 'p');
        element.appendChild(preText);
        element.appendChild(link);
        element.appendChild(postText);

        const parent = document.createElement('div');
        parent.appendChild(element);

        onDOMReady(() => {
            if(this.options.top) {
                document.body.prepend(parent);
            } else {
                document.body.appendChild(parent)
            }
        });
        
        element.style.color = this.theme.color;
        link.style.color = this.theme.link;
        element.style.borderColor = this.theme.border;
        if (this.options.fixed) {
            element.style.background = this.theme.background;
        }
        

        // setup the positioing
        element.style.display = 'block';
        
        if (this.options.fixed) {
            parent.style.position = 'fixed';
            // align to the right
            parent.style.right = Legal.LARGE_SPACE;
            element.style.position = 'relative';
            element.style.right = Legal.LARGE_SPACE;

            // margin and padding
            element.style.border = `${Legal.BORDER_SIZE} solid ${this.theme.border}`;
            element.style.padding = Legal.SMALL_SPACE;
            element.style.borderRadius = Legal.LARGE_SPACE;

            if (this.options.top) {
                parent.style.top = '0px';
            } else {
                parent.style.bottom = '0px';
            }
        } else {

            // align to the right
            element.style.textAlign = 'right';

            // hide overflow on the parent
            parent.style.margin = '0';
            parent.style.padding = '0';
            parent.style.overflow = 'none';
            parent.style.width = '100%';

            // no margin, and proper padding
            element.style.margin = '0';
            element.style.paddingTop = Legal.SMALL_SPACE;
            element.style.paddingBottom = Legal.SMALL_SPACE;
            element.style.paddingRight = Legal.LARGE_SPACE;

            // border in the right place
            if (this.options.top) {
                element.style.borderBottom = `${Legal.BORDER_SIZE} solid ${this.theme.border}`;
            } else {
                element.style.borderTop = `${Legal.BORDER_SIZE} solid ${this.theme.border}`;
            }
        }

        element.appendChild(this.extraNode);

        // if we have a site-id turn on the tracking script. 
        if(this.options.siteID) {
            this.stats = !this.optout;
        }
    }

    //
    // STATS
    //
    private static readonly STATS_ID_ATTR = 'data-site-id'; // key to read site-id from

    private static readonly ACKEE_SERVER = 'https://track.everyone.wtf'; // server for ackee
    private static readonly ACKEE_SCRIPT = Legal.ACKEE_SERVER + '/tracker.js'; // tracker


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

    private unloadStatsScript() {
        if (!this.statsScript) return;
        this.statsScript.parentNode?.removeChild(this.statsScript)
    }

    private generateStatsLink(toSetTo: boolean) {
        this.extraNode.innerHTML = "";

        // create a link to (undo) opt-out
        const link = document.createElement('a');
        link.setAttribute('href', "#");
        link.style.color = this.theme.link;
        link.appendChild(document.createTextNode(toSetTo ? Legal.TEXT_STATS_OFF : Legal.TEXT_STATS_ON));
        link.addEventListener('click', (e: MouseEvent) => {
            e.preventDefault();
            this.stats = toSetTo;
            return false;
        });
        
        // set the link as the child of extraNode. 
        this.extraNode.innerHTML = "";
        this.extraNode.appendChild(link);
        this.extraNode.appendChild(document.createTextNode(Legal.TEXT_STATS_SUFFIX));
    }

    //
    // OPTOUT
    //

    

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

    private static readonly STATS_OPT_OUT_KEY = 'wtf.track.everyone.old.photos';
    private static readonly STATS_OPT_OUT_VALUE = `When in the Course of human events, it becomes necessary for
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
to each other our Lives, our Fortunes and our sacred Honor.`;
}

// read the current script
const script = document.currentScript;
if (script === null) {
    console.error('Something went wrong loading the legal script. ');
    console.error('This probably means document.currentScript isn\'t supported by this browser. ');
    console.error('Bailing out. ');
} else {
    (window as any).legal = Legal.fromScriptTag(script as HTMLScriptElement);
    (window as any).legal.run();
}

