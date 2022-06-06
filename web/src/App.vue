<template>
  <Nav @reload="onReloadClick" @console="onConsoleClick"/>
  <h1 id="top">math-o-matic</h1>
  <p>
    <a href="https://github.com/math-o-matic/math-o-matic" style="text-decoration: none;"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDE2IDE2IiB2ZXJzaW9uPSIxLjEiPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTggMEMzLjU4IDAgMCAzLjU4IDAgOGMwIDMuNTQgMi4yOSA2LjUzIDUuNDcgNy41OS40LjA3LjU1LS4xNy41NS0uMzggMC0uMTktLjAxLS44Mi0uMDEtMS40OS0yLjAxLjM3LTIuNTMtLjQ5LTIuNjktLjk0LS4wOS0uMjMtLjQ4LS45NC0uODItMS4xMy0uMjgtLjE1LS42OC0uNTItLjAxLS41My42My0uMDEgMS4wOC41OCAxLjIzLjgyLjcyIDEuMjEgMS44Ny44NyAyLjMzLjY2LjA3LS41Mi4yOC0uODcuNTEtMS4wNy0xLjc4LS4yLTMuNjQtLjg5LTMuNjQtMy45NSAwLS44Ny4zMS0xLjU5LjgyLTIuMTUtLjA4LS4yLS4zNi0xLjAyLjA4LTIuMTIgMCAwIC42Ny0uMjEgMi4yLjgyLjY0LS4xOCAxLjMyLS4yNyAyLS4yNy42OCAwIDEuMzYuMDkgMiAuMjcgMS41My0xLjA0IDIuMi0uODIgMi4yLS44Mi40NCAxLjEuMTYgMS45Mi4wOCAyLjEyLjUxLjU2LjgyIDEuMjcuODIgMi4xNSAwIDMuMDctMS44NyAzLjc1LTMuNjUgMy45NS4yOS4yNS41NC43My41NCAxLjQ4IDAgMS4wNy0uMDEgMS45My0uMDEgMi4yIDAgLjIxLjE1LjQ2LjU1LjM4QTguMDEzIDguMDEzIDAgMDAxNiA4YzAtNC40Mi0zLjU4LTgtOC04eiI+PC9wYXRoPjwvc3ZnPg==" style="vertical-align: middle; margin-right:.5em">GitHub repository</a> &nbsp; <a href="../docs/build/index.html" style="text-decoration: none;"><img style="vertical-align: middle;margin-right:.5em;" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjNjY2Ij48cGF0aCBkPSJNMTQgMkg2Yy0xLjEgMC0xLjk5LjktMS45OSAyTDQgMjBjMCAxLjEuODkgMiAxLjk5IDJIMThjMS4xIDAgMi0uOSAyLTJWOGwtNi02em0yIDE2SDh2LTJoOHYyem0wLTRIOHYtMmg4djJ6bS0zLTVWMy41TDE4LjUgOUgxM3oiLz48L3N2Zz4=">documentation</a>
  </p>
  <blockquote v-if="isFileScheme">
    <b>Note.</b> This page seems to have been loaded using <code>file://</code> scheme, and the page might not work due to the CORS policy. The following is a list of possible solutions:
    <ul>
      <li><b>Create a local server</b>: You can easily create a static server using the <a href="https://www.npmjs.com/package/http-server">http-server</a> package from npm. At the project root run <pre><code>npx http-server -c-1</code></pre> and go to the web address displayed on the terminal.</li>
      <li><b>Set <code>--allow-file-access-from-files</code> flag in Chrome</b>: If you are using Chrome, you can enable file access by setting the <code>--allow-file-access-from-files</code> flag. <a href="https://stackoverflow.com/a/18137280">StackOverflow</a></li>
    </ul>
  </blockquote>
  <p style="margin-top:1em">This page shows the current math-o-matic proof system located at <code>/math</code>. Click on one of the links at the bottom of this page to load the proof system. Depending on the performance of your device this may take a lot of time.</p>
  <h2>Definitions</h2>
  <div id="list">Loading the systempath ...</div>
  <Console ref="console" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Nav from './components/Nav.vue';
import Console from './components/Console.vue'

export default defineComponent({
    name: "App",
    components: { Nav, Console },
    data() {
        return {
            isFileScheme: location.protocol == "file:",
            systempath: null as any
        };
    },
    methods: {
      onReloadClick() {
        // @ts-ignore 
			  reload(Globals.fqn);
      },
      onConsoleClick() {
        (this.$refs.console as any).toggleConsole();
      }
    },
    mounted() {
        (async () => {
            var res = await fetch("systempath.json");
            if (!res.ok)
                throw Error(res.statusText);
            this.systempath = await res.json();
            // @ts-ignore
            Globals.systempath = this.systempath;
            var html = (function recurse(obj, packageName) {
                var ret = "<ul>";
                for (var key in obj) {
                    if (typeof obj[key] == "string") {
                        ret += `<li><a href="javascript:reload('${packageName + key}')"><b>system</b> ${key}</a> (${obj[key]})</li>`;
                    }
                    else {
                        ret += `<li><b>package</b> ${key}`;
                        ret += recurse(obj[key], key + ".");
                        ret += `</li>`;
                    }
                }
                ret += "</ul>";
                return ret;
            })(this.systempath.systems, "");
            document.querySelector("#list")!.innerHTML = html;
        })();
    }
});
</script>

<style>

</style>
