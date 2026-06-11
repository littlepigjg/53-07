# Malformed HTML Test

<div unclosed
<p>Missing close tag
<span class="test">Nested <b>bold</span></b>
< script>alert('xss')< /script>
<div><p>Nested unclosed
<img src=x onerror=alert(1)>
<a href="javascript:void(0)">link</a>
