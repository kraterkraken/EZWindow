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


Possible Enhancement: METHOD TO ADD WIDGETS
*/



class EZWindow
{
    constructor(x, y, height, width, id, title)
    {
        // windows have a frame, a titlebar, and a content area
        this.frame = document.createElement("div");
        this.frame.id = id;
        this.frame.classList.add("ezwindow_frame");
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
            // might want to check if the window is "dirty"
            // before dismissing the window

            // "this" is the X button (aka, closeButton), therefore ...
            let frame = this.parentNode.parentNode;
            let doc = frame.parentNode;

            // remove the window from the manager's list
            ezWindowManager.removeWindow(frame.id);

            //remove the window from the document
            doc.removeChild(frame);
        }

        this.contentArea = document.createElement("div");
        this.contentArea.id = id + "_contentArea";
        this.contentArea.classList.add("ezwindow_contentarea");
        this.contentArea.style.flex = "1 1 auto";
        this.contentArea.innerHTML = "ContentArea goes here";

        document.body.appendChild(this.frame);
        this.frame.appendChild(this.titlebar);
        this.frame.appendChild(this.contentArea);

        this.makeDraggable(this.frame.id, "ezwindow_titlebar", "ezwindow_closebutton");
        ezWindowManager.addWindow(this);
    }

    makeDraggable(id, targetClass, avoidClass)
    {
        // dragee : the thing we want to drag
        // clickTarget : the child class of the dragee that needs to be
        //               clicked in order to start dragging the dragee
        //               (if clickTarget not specified, the target is
        //                is just the dragee)
        var dragee = document.getElementById(id);
        if (dragee == null) return;
        var clickTarget = dragee;
        if (targetClass != null)
        {
            clickTarget = dragee.querySelector("." + targetClass);
            if (clickTarget == null) return;
        }

        var clickX = 0;
        var clickY = 0;

        clickTarget.onmousedown = startDragging;

        function startDragging(e)
        {
            e = e || window.event(); // I have no idea what this does
            e.preventDefault(); // I have a vague idea what this does

            if (avoidClass != null && e.target.className == avoidClass) return;

            // remember where in the window we clicked
            clickX = e.offsetX;
            clickY = e.offsetY;

            // now that we are moving the window, we need the
            // **DOCUMENT** to start listening to mouse move events
            // and mouse up events
            document.onmousemove = dragIt;
            document.onmouseup = stopDragging;
        }

        function dragIt(e)
        {
            e = e || window.event(); // I have no idea what this does
            e.preventDefault(); // I have a vague idea what this does

            // move the window to the new location
            dragee.style.left = e.clientX - clickX + "px";
            dragee.style.top = e.clientY - clickY + "px";
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
    win.contentArea.innerHTML =
        "frame_id="+win.frame.id + ",<br>"
        + "zIndex="+win.frame.style.zIndex + ",<br>"
        + "count="+ezWindowManager.winList.length;

}
