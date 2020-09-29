def make(live, flot, cookies, dark, defer, siteid):
    url = []
    flags = []
    if cookies:
        url.append("cookies")
        flags.append("cookies")
    if dark:
        url.append("dark")
        flags.append("dark")
    if flot:
        url.append("float")
        flags.append("float")
    if defer:
        url.append("defer")
    if siteid:
        url.append("siteid")
    if live:
        url.append("live")

    if len(url) > 0:
        url = "-".join(url)
    else:
        url = "default"
    
    if len(flags) > 0:
        flags = "?" + ",".join(flags)
    else:
        flags = ""
    
    out = "---"
    out += "\nlayout: test"
    out += "\nflags: "+flags
    if defer:
        out += "\ndefer: true"
    else:
        out += "\ndefer: false"
    if siteid:
        out += "\nsiteid: true"
    else:
        out += "\nsiteid: false"
    if live:
        out += "\nlive: true"
    else:
        out += "\nlive: false"
    out += "\n---"

    with open("auto/" + url + ".md", "w") as f:
        f.write(out)

    


for flot in [True, False]:
    for cookies in [True, False]:
        for dark in [True, False]:
            for defer in [True, False]:
                for siteid in [True, False]:
                    for live in [True, False]:
                        make(live, flot, cookies, dark, defer, siteid)

