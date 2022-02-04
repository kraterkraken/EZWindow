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
        // adds a window to the list, and keeps track of the max zIndex
        this.winList.push(win);
        this.maxZ++;
        win.frame.style.zIndex = this.maxZ;
        return;
    }

    getWindowById(id)
    {
        // searches for the window with the given id.
        // if found, returns the window and its index in an object {win, index}.
        // if not found, returns null for the window, and -1 for the index
        for (let i=0; i < this.winList.length; i++)
        {
            if (this.winList[i].frame.id == id)
            {
                return {win: this.winList[i], index: i};
            }
        }
        return {win: null, index: -1};
    }

    removeWindow(id)
    {
        // removes a window from the list and recalculates the max zIndex
        let i = this.getWindowById(id).index;
        if (i >= 0)
        {
            ezWindowManager.winList.splice(i, 1);
            this.maxZ = this.findMaxZ();
        }
    }

    findMaxZ()
    {
        // finds the highest zIndex value in the list of windows
        return this.winList.length?
            Math.max(...this.winList.map(win => parseInt(win.frame.style.zIndex)))
            :
            0;
    }

    moveToFront(id)
    {
        // moves the window with the given id to the front by giving it
        // a zIndex higher than all the others
        let win = this.getWindowById(id).win;
        if (win && this.maxZ > parseInt(win.frame.style.zIndex))
        {
            this.maxZ++;
            win.frame.style.zIndex = this.maxZ;
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
6) call back for loading data =AND= callback for returning/saving data
7) ask window manager to determine where it opens, instead of providing x, y
8) dragability
9) min size

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

        this.contentArea = document.createElement("div");
        this.contentArea.id = id + "_contentArea";
        this.contentArea.classList.add("ezwindow_contentarea");
        this.contentArea.style.flex = "1 1 auto";

        document.body.appendChild(this.frame);
        this.frame.appendChild(this.titlebar);
        this.frame.appendChild(this.contentArea);

        this.setupMouseHandlers();
        ezWindowManager.addWindow(this);
    }

    addContent(element)
    {
        this.contentArea.appendChild(element);
    }

    setupMouseHandlers()
    {
        let frame = this.frame; // because "this" won't work in event handlers

        ////////////////////////////////////////////////////////////////////////
        //          CLOSE BUTTON - ONCLICK (close the window)
        ////////////////////////////////////////////////////////////////////////
        this.closeButton.onclick = function(e){
            // close/X button clicked, so close the window if not dirty
            let win = ezWindowManager.getWindowById(frame.id).win;
            if (win.isDirty) return;  // TODO: warning first?

            ezWindowManager.removeWindow(frame.id);
            frame.parentNode.removeChild(frame);
        }

        ////////////////////////////////////////////////////////////////////////
        //          FRAME - ONMOUSEMOVE (mouse cursor changes)
        ////////////////////////////////////////////////////////////////////////
        this.frame.onmousemove = function(e) {
            e = e || window.event(); // I have no idea what this does
            e.preventDefault(); // I have a vague idea what this does

            // ................. MOUSE CURSOR SET UP .................
            if (e.target.className == "ezwindow_frame")
            {
                // need to change the mouse cursor to the resizer arrow(s)
                let top = frame.getBoundingClientRect().top;
                let left = frame.getBoundingClientRect().left;
                let bottom = frame.getBoundingClientRect().bottom;
                let right = frame.getBoundingClientRect().right;

                // the following handles all 8 cases: n, s, e, w, ne, nw, se, sw
                let dir = "";
                if (top < e.clientY && e.clientY < top+25)
                    dir += "n";
                else if (bottom > e.clientY && e.clientY > bottom-25)
                    dir += "s";

                if (left < e.clientX && e.clientX < left+25)
                    dir += "w";
                else if (right > e.clientX && e.clientX > right-25)
                    dir += "e";

                if (dir != "")
                    frame.style.cursor = dir + "-resize";
            }
        } // end onmousemove block

        ////////////////////////////////////////////////////////////////////////
        //          FRAME - ONMOUSEDOWN (dragging / resizing)
        ////////////////////////////////////////////////////////////////////////
        this.frame.onmousedown = function(e) {
            e = e || window.event(); // I have no idea what this does
            e.preventDefault(); // I have a vague idea what this does
            ezWindowManager.moveToFront(this.id);

            // ................. DRAGGING .................
            if (e.target.className == "ezwindow_titlebar")
            {
                // mousedown on titlebar, so initialize drag
                document.onmousemove = dragIt;
                document.onmouseup = stopDragging;
                function dragIt(e)
                {
                    e = e || window.event(); // I have no idea what this does
                    e.preventDefault(); // I have a vague idea what this does

                    // move the window to the new location
                    var old_left = frame.getBoundingClientRect().left;
                    var old_top = frame.getBoundingClientRect().top;
                    frame.style.left = (old_left + e.movementX) + "px";
                    frame.style.top = (old_top + e.movementY) + "px";

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

            // ................. RESIZING .................
            else if (e.target.className == "ezwindow_frame")
            {
                // mousedown on frame and nothing else, so initialize resize
                document.onmousemove = resizeIt;
                document.onmouseup = stopResizing;
                function resizeIt(e)
                {
                    e = e || window.event(); // I have no idea what this does
                    e.preventDefault(); // I have a vague idea what this does

                    var old_top = frame.getBoundingClientRect().top;
                    var old_bottom = frame.getBoundingClientRect().bottom;
                    var old_left = frame.getBoundingClientRect().left;
                    var old_right = frame.getBoundingClientRect().right;
                    var old_height = old_bottom - old_top;
                    var old_width = old_right - old_left;

                    if (!frame.style.cursor.includes("-resize")) return;

                    let dir = frame.style.cursor.split('-')[0];

                    if (dir.includes("n"))
                    {
                        frame.style.top =  (old_top + e.movementY) + "px"
                        frame.style.height = (old_height - e.movementY) + "px";
                    }
                    if (dir.includes("s"))
                    {
                        frame.style.height = (old_height + e.movementY) + "px";
                    }
                    if (dir.includes("e"))
                    {
                        frame.style.width = (old_width + e.movementX) + "px";
                    }
                    if (dir.includes("w"))
                    {
                        frame.style.left =  (old_left + e.movementX) + "px"
                        frame.style.width = (old_width - e.movementX) + "px";
                    }
                }
                function stopResizing(e)
                {
                    e = e || window.event(); // I have no idea what this does
                    e.preventDefault(); // I have a vague idea what this does

                    document.onmousemove = null;
                    document.onmouseup = null;
                }
            } // end resize block
        } // end onmousedown block
    } // end setupMouseHandlers
} // end class EZWindow

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
