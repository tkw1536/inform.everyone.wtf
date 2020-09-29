---
layout: default
---

<style>
    td:not(:empty):not(:last-child) {
        background: black;
    }
</style>

<table>
    <tr>
        <th>live</th>
        <th>defer</th>
        <th>cookies</th>
        <th>dark</th>
        <th>float</th>
        <th>siteid</th>
        <th>
        </th>
    </tr>
{% assign pages = site.pages | where: "layout", "test" | sort: "siteid" | sort: "flags"  | sort: "defer" | sort: "live" %}
{% for page in pages %}
    <tr>
        <td>{% if page.live %}x{%endif%}</td>
        <td>{% if page.defer %}x{%endif%}</td>
        <td>{% if page.flags contains "cookies" %}x{% endif %}</td>
        <td>{% if page.flags contains "dark" %}x{% endif %}</td>
        <td>{% if page.flags contains "float" %}x{% endif %}</td>
        <td>{% if page.siteid %}x{%endif%}</td>
        <td>
            <a href="{{ page.url }}">
                {{page.url | replace: ".html", "" | replace: "/tests/auto/", ""}}
            </a>
        </td>
    </tr>
{% endfor %}
</table>

