import { useMemo, useRef, useEffect } from "react";

const BlogContentIframe = ({
  headHtml = "",
  bodyHtml = "",
  baseHref = "/",
  iframeId = "blog-iframe",
}) => {
  const iframeRef = useRef(null);

  const srcDoc = useMemo(() => {
    const autoHeightAndLinksScript = `
      <script>
        (function () {
          function resize() {
            try {
              var h = Math.max(
                document.body.scrollHeight,
                document.documentElement.scrollHeight
              );
              parent.postMessage({ id: '${iframeId}', height: h }, '*');
            } catch (e) {}
          }

          function retargetLinks(root) {
            var anchors = (root || document).querySelectorAll('a[href]');
            anchors.forEach(function(a){
              // skip same-page hash jumps if you want them to stay inside iframe
              // if (a.getAttribute('href').startsWith('#')) return;

              a.setAttribute('target', '_blank');
              // security best-practice for new-tab
              var rel = (a.getAttribute('rel') || '').split(/\\s+/);
              if (!rel.includes('noopener')) rel.push('noopener');
              if (!rel.includes('noreferrer')) rel.push('noreferrer');
              a.setAttribute('rel', rel.join(' ').trim());
            });
          }

          // run once on load
          window.addEventListener('load', function(){
            retargetLinks(document);
            resize();
          });

          // keep height accurate
          new ResizeObserver(resize).observe(document.body);

          // handle dynamically injected content
          new MutationObserver(function(muts){
            muts.forEach(function(m){
              if (m.type === 'childList') {
                m.addedNodes.forEach(function(n){
                  if (n.nodeType === 1) retargetLinks(n);
                });
              } else if (m.type === 'attributes' && m.target.tagName === 'A') {
                retargetLinks(m.target);
              }
            });
            resize();
          }).observe(document.documentElement, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['href', 'rel', 'target']
          });
        })();
      </script>
    `;

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <!-- base sets default target for all relative links -->
          <base href="${baseHref}" target="_blank">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          ${headHtml || ""}
          <style>
            html, body { overflow: hidden !important; }
          </style>
        </head>
        <body style="margin:0;padding:0;">
          ${bodyHtml || ""}
          ${autoHeightAndLinksScript}
        </body>
      </html>
    `;
  }, [headHtml, bodyHtml, baseHref, iframeId]);

  useEffect(() => {
    const handleResize = (e) => {
      if (e.data?.id === iframeId && iframeRef.current) {
        iframeRef.current.style.height = e.data.height + "px";
      }
    };
    window.addEventListener("message", handleResize);
    return () => window.removeEventListener("message", handleResize);
  }, [iframeId]);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcDoc}
      // allow-popups lets target="_blank"/window.open work in sandbox
      // allow-popups-to-escape-sandbox allows tabs to open outside the sandbox
      sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
      style={{ width: "100%", border: "none", minHeight: "500px", overflow: "hidden" }}
      scrolling="no"
      title="Blog Content"
    />
  );
};

export default BlogContentIframe;
