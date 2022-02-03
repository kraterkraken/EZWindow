class EZWindowManager
{
    // This class keeps track of any windows that are open.  It manages
    // things like the zIndex of each window and where they open, as well
    // as maintaining a list of all the open windows.
    constructor()
    {
        this.winList = [];
        this.maxZ = 0;
    }

    addWindow(win)
    {
        this.winList.push(win);
        this.maxZ++;
        win.frame.style.zIndex = this.maxZ;
        return this.winList.length - 1; // return the index of the newly added window
    }

    getWindowById(id)
    {
        for (let i=0; i < this.winList.length; i++)
        {
            if (this.winList[i].frame.id == id)
            {
                return this.winList[i];
            }
        }
        return null;
    }

    removeWindow(id)
    {
        for (let i=0; i < this.winList.length; i++)
        {
            if (this.winList[i].frame.id == id)
            {
                ezWindowManager.winList.splice(i, 1);
            }
        }
        this.maxZ = this.findMaxZ();
    }

    findMaxZ()
    {

        return this.winList.length?
            Math.max(...this.winList.map(win => parseInt(win.frame.style.zIndex)))
            :
            0;
    }

    moveToFront(id)
    {
        for (let i=0; i<this.winList.length; i++)
        {
            if (this.winList[i].frame.id == id
                && this.maxZ > parseInt(this.winList[i].frame.style.zIndex))
            {
                this.maxZ++;
                this.winList[i].frame.style.zIndex = this.maxZ;
                break;
            }
        }
    }
}
const ezWindowManager = new EZWindowManager(); // the global instance of the manager

/*
Possible enhancement:  OPTIONS

Options could include things like:
1) what buttons appear in upper right corner (dismiss, maximize, minimize)
2) modality
3) whether or not to have a titlebar (or only a titlebar?)
4) resizability
5) dialog buttons (ok, cancel, yes, no, etc)
6) some sort of callback for returning results via JSON
7) ask window manager to determine where it opens, instead of providing x, y
8) dragability

*/



class EZWindow
{
    constructor(x, y, height, width, id, title)
    {
        this.isDirty = false;

        // windows have a frame, a titlebar (with X button to close), and a content area
        this.frame = document.createElement("div");
        this.frame.id = id;
        this.frame.classList.add("ezwindow_frame");
        this.frame.style.boxSizing = "border-box"; /* makes widths and heights INCLUDE the border */
        this.frame.style.left = x + "px";
        this.frame.style.top = y + "px";
        this.frame.style.height = height + "px";
        this.frame.style.width = width + "px";
        this.frame.style.position = "absolute";
        this.frame.style.display = "flex"; /* only easy way to get contentarea to fill the window */
        this.frame.style.flexFlow = "column"; /* only easy way to get contentarea to fill the window */
        this.frame.onmousedown = function(e) {
            ezWindowManager.moveToFront(this.id);
        }

        this.titlebar = document.createElement("div");
        this.titlebar.id = id + "_titlebar";
        this.titlebar.classList.add("ezwindow_titlebar");
        this.titlebar.flex = "0 1 auto";
        this.titlebar.innerHTML = title;
        this.closeButton = document.createElement("button");
        this.closeButton.classList.add("ezwindow_closebutton");
        this.closeButton.style.float = "right";
        this.closeButton.style.display = "inline-block";
        this.closeButton.innerHTML = "&#10006"; // symbolic X shape for the window close button
        this.titlebar.appendChild(this.closeButton);
        this.closeButton.onclick = function(e){
            // "this" is the X button (aka, closeButton), therefore ...
            let frame = this.parentNode.parentNode;
            let doc = frame.parentNode;

            // prevent close if window dirty
            let win = ezWindowManager.getWindowById(frame.id);
            if (win.isDirty) return;  // TODO: warning first?

            ezWindowManager.removeWindow(frame.id);
            doc.removeChild(frame);
        }

        this.contentArea = document.createElement("div");
        this.contentArea.id = id + "_contentArea";
        this.contentArea.classList.add("ezwindow_contentarea");
        this.contentArea.style.flex = "1 1 auto";

        document.body.appendChild(this.frame);
        this.frame.appendChild(this.titlebar);
        this.frame.appendChild(this.contentArea);

        //this.makeResizeable(this.frame.id);
        this.makeDraggable(this.frame.id, "ezwindow_titlebar", "ezwindow_closebutton");
        ezWindowManager.addWindow(this);
    }

    addContent(element)
    {
        this.contentArea.appendChild(element);
    }

    makeResizeable(id)
    {
        var resizee = document.getElementById(id);
        if (resizee == null) return;
        /*******************************************************************/
        resizee.onmouseover = changePointer;
        resizee.onmousedown = startResize;
        /*******************************************************************/

        function changePointer(e)
        {
            posX
        }
        function allowResize(e)
        {
            e = e || window.event(); // I have no idea what this does
            e.preventDefault(); // I have a vague idea what this does

            // if the target is NOT the resizee, bail out because we are hovering
            // over one of resizee's children
            console.log("target.id=" + e.target.id);
            console.log("currenttarget.id=" + e.currentTarget.id);
            console.log("resizee.id=" + resizee.id);
            if (e.target.id != resizee.id) return;

            console.log("allowResize");
            if (isResizing) return;

            var oldMouseDownHandler = this.onmousedown;
            this.onmousedown = startResize;
            this.style.cursor = "n-resize"; // test
        }
        function disallowResize(e)
        {
            e = e || window.event(); // I have no idea what this does
            e.preventDefault(); // I have a vague idea what this does

            console.log("disallowResize");
            if (isResizing) return;

            document.onmousemove = null;
            document.onmouseup = null;
            this.onmousedown = oldMouseDownHandler;
        }
        function startResize(e)
        {
            e = e || window.event(); // I have no idea what this does
            e.preventDefault(); // I have a vague idea what this does

            isResizing = true;

            // remember where in the window we clicked
            console.log("startResize: left="+resizee.style.left+", top="+resizee.style.top);

            // **DOCUMENT** must start listening to mouse move events
            // and mouse up events
            document.onmousemove = resizeIt;
            document.onmouseup = stopResizing;
        }
        function resizeIt(e)
        {
            console.log("resizeIt: cursor="+resizee.style.cursor);
            console.log("resizeIt: e.clientX="+e.clientX);
            console.log("resizeIt: e.clientY="+e.clientY);
            console.log("resizeIt: e.movementX="+e.movementX);
            console.log("resizeIt: e.movementY="+e.movementY);
            console.log("resizeIt: width="+resizee.style.width);
            console.log("resizeIt: height="+resizee.style.height);
            console.log("resizeIt: clientrect.left="+resizee.getBoundingClientRect().left);
            console.log("resizeIt: clientrect.right="+resizee.getBoundingClientRect().right);
            console.log("resizeIt: clientrect.top="+resizee.getBoundingClientRect().top);
            console.log("resizeIt: clientrect.bottom="+resizee.getBoundingClientRect().bottom);

            var old_top = resizee.getBoundingClientRect().top;
            var old_bottom = resizee.getBoundingClientRect().bottom;
            var old_height = old_bottom - old_top;

            // based on which cursor we have, start changing the size
            if (resizee.style.cursor == "n-resize")
            {
                resizee.style.top =  (old_top + e.movementY) + "px"
                resizee.style.height = (old_height - e.movementY) + "px";
            }
            // else if (resizee.style.cursor == "s-resize")
            // {
            //     // only need to change the height
            //     resizee.style.height = e.clientY + "px";
            // }
            // else if (resizee.style.cursor = "e-resize")
            // {
            //     // only need to change width
            //     resizee.style.width = e.clientX + "px";
            // }
            // else if (resizee.style.cursor = "w-resize")
            // {
            //     resizee.style.left = e.clientX - clickX + "px";
            //
            // }
        }
        function stopResizing(e)
        {
            e = e || window.event(); // I have no idea what this does
            e.preventDefault(); // I have a vague idea what this does

            isResizing = false;
            document.onmousemove = null;
            document.onmouseup = null;
            this.onmousedown = oldMouseDownHandler;
        }
    }

    makeDraggable(id, targetClass, avoidClass)
    {
        // dragee : the thing we want to drag
        // clickTarget : the child class of the dragee that needs to be
        //               clicked in order to start dragging the dragee
        //               (if clickTarget not specified, the target is
        //                is just the dragee)
        let dragee = document.getElementById(id);
        if (dragee == null) return;

        let clickTarget = dragee;
        if (targetClass != null)
        {
            clickTarget = dragee.querySelector("." + targetClass);
            if (clickTarget == null) return;
        }

        clickTarget.onmousedown = startDragging;

        function startDragging(e)
        {
            e = e || window.event(); // I have no idea what this does
            e.preventDefault(); // I have a vague idea what this does

            if (avoidClass != null && e.target.className == avoidClass) return;

            // **DOCUMENT** must now start handling mouse up/move events
            document.onmousemove = dragIt;
            document.onmouseup = stopDragging;
        }

        function dragIt(e)
        {
            e = e || window.event(); // I have no idea what this does
            e.preventDefault(); // I have a vague idea what this does

            // move the window to the new location
            var old_left = dragee.getBoundingClientRect().left;
            var old_top = dragee.getBoundingClientRect().top;
            dragee.style.left = (old_left + e.movementX) + "px";
            dragee.style.top = (old_top + e.movementY) + "px";

        }

        function stopDragging(e)
        {
            e = e || window.event(); // I have no idea what this does
            e.preventDefault(); // I have a vague idea what this does

            // the mouse is up, so we are no longer moving the window
            // therefore the document no longer should be listening
            // for these events
            document.onmousemove = null;
            document.onmouseup = null;
        }
    }
}

var win = null;

function create()
{
    let n = ezWindowManager.winList.length;
    win = new EZWindow(200, 200, 400, 350, "myWindowId_" + n, "Title Here!");

    blurb = document.createElement("p");
    blurb.innerHTML = "Please Enter Your Stuff:";
    blurb.class = "ezwindow_heading";

    label1 = document.createElement("label");
    label1.innerHTML = "Favorite Color:";
    label1.class = "ezwindow_label";
    textBox1 = document.createElement("input");
    textBox1.type = "text";
    textBox1.class = "ezwindow_input";

    label2 = document.createElement("label");
    label2.innerHTML = "Password:";
    label2.class = "ezwindow_label";
    textBox2 = document.createElement("input");
    textBox2.type = "password";
    textBox2.class = "ezwindow_input";

    button1 = document.createElement("button");
    button1.innerHTML = "Click This!";
    button1.class = "ezwindow_button";

    win.addContent(blurb);
    win.addContent(label1);
    win.addContent(textBox1);
    win.addContent(label2);
    win.addContent(textBox2);
    win.addContent(button1);

}
