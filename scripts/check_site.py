#!/usr/bin/env python3
"""Offline checks for the static site (no dependencies).

* every local href/src points to an existing file
* every #fragment (same page or other local page) points to an existing id
* every page has a <title>, a lang attribute, exactly one <h1>, and the READ FIRST
  warning on the home and download pages
* no external <script>/<link rel=stylesheet>/<img> (no CDNs or trackers)
Exit status 1 on any problem.
"""
import re, sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, unquote

ROOT = Path(__file__).resolve().parent.parent
PAGES = ['index.html', 'download.html', 'docs.html', 'about.html', 'support.html', '404.html']


class P(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.refs, self.h1, self.title, self.lang, self.ext_res = set(), [], 0, False, False, []

    def handle_starttag(self, tag, a):
        a = dict(a)
        if 'id' in a:
            self.ids.add(a['id'])
        if tag == 'html' and a.get('lang'):
            self.lang = True
        if tag == 'h1':
            self.h1 += 1
        if tag == 'title':
            self.title = True
        for k in ('href', 'src'):
            if k in a:
                self.refs.append((tag, k, a[k]))
                if tag in ('script', 'img', 'iframe') or (tag == 'link' and a.get('rel') in ('stylesheet', 'icon')):
                    if re.match(r'^(https?:)?//', a[k]):
                        self.ext_res.append(a[k])


def main():
    bad = []
    parsed = {}
    for pg in PAGES:
        p = P()
        p.feed((ROOT / pg).read_text())
        parsed[pg] = p
    for pg, p in parsed.items():
        if not p.title: bad.append(f'{pg}: missing <title>')
        if not p.lang: bad.append(f'{pg}: missing html lang')
        if p.h1 != 1: bad.append(f'{pg}: expected exactly one <h1>, found {p.h1}')
        for r in p.ext_res: bad.append(f'{pg}: external resource {r}')
        if pg in ('index.html', 'download.html'):
            t = (ROOT / pg).read_text()
            for needle in ('READ FIRST', 'NOT VALIDATED ON A PHYSICAL RASPBERRY PI', 'RECEIVE-ONLY BY DEFAULT', 'UNVERIFIED'):
                if needle not in t: bad.append(f'{pg}: missing warning text {needle!r}')
        for tag, k, v in p.refs:
            u = urlparse(v)
            if u.scheme in ('http', 'https', 'mailto', 'data') or v.startswith('//') or v.startswith('/'):
                continue
            path = unquote(u.path) or pg
            target = ROOT / path
            if not target.is_file():
                bad.append(f'{pg}: broken local ref {v}')
                continue
            if u.fragment and path.endswith('.html'):
                tp = parsed.get(path)
                if tp is not None and u.fragment not in tp.ids:
                    bad.append(f'{pg}: missing anchor {v}')
    for line in bad: print('FAIL', line)
    print('checked', len(PAGES), 'pages;', len(bad), 'problem(s)')
    sys.exit(1 if bad else 0)


main()
