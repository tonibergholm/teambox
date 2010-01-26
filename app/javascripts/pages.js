Event.addBehavior({
  ".note:mouseover": function(e){
    $(this).select('p.actions').each(function(e) {
      e.show();
    });
  },
  ".note:mouseout": function(e){
    $$(".note p.actions").each(function(e){ 
      e.hide();
    });
  },
  ".divider:mouseover": function(e){
    $(this).select('p.actions').each(function(e) {
      e.show();
    });
  },
  ".divider:mouseout": function(e){
    $$(".divider p.actions").each(function(e){ 
      e.hide();
    });
  },
  "#pageInsert:click": function(e) {
	if (InsertionBar.current_form) {
	  InsertionBar.place();
	} else {
      InsertionBar.show();
	  InsertionMarker.setEnabled(false);
	  InsertionMarker.hide();
    }

    return false;
  },
  "#pageInsertItemCancel a:click": function(e) {
    InsertionBar.hide();
    InsertionMarker.setEnabled(true);
    
    return false;
  }
});

// Page controller object
var Page = {
  MARGIN: 20,
  SLOT_VERGE: 20,
  READONLY: false,

  init: function(readonly, url, auth) {
    this.READONLY = readonly;
	this.url = url;
	this.auth = auth;
    if (!readonly) {
      InsertionMarker.init();
      InsertionBar.init();
      InsertionMarker.set(null, true);

      $($('content').parentNode).observe('mousemove', InsertionMarkerFunc);
    }
  },

  makeSortable: function() {
    if (this.READONLY)
      return;

    Sortable.create('slots', {handle: 'slot_handle', tag: 'div', only: 'pageSlot',
      onUpdate: function() {
        new Ajax.Request(Page.url + '/reorder',
        {
          asynchronous:true, evalScripts:true,
          onComplete:function(request) {},
          parameters:Sortable.serialize('slots', {name: 'slots'}) + '&authenticity_token=' + Page.auth
        });
      } 
	});		
  }
}

// Insertion bar which appears between slots
var InsertionBar = {
  element: null,
  element_bar: null,
  element_form: null,

  init: function() {
    this.element = $('pageInsertItems');
    this.element_bar  = $('pageInsertItemsBar');
    this.current_form = null;
  },

  show: function() {
    this.place();
    this.element_bar.setStyle({'height': '32px'}).show();//.animate({"height": "25px"}, "fast");
  },

  place: function() {
    InsertionMarker.element.insert({before: this.element});
  },

  hide: function() {
    this.element_bar.hide();
  },

  revealForm: function() {
    // Reveal form
    this.element_bar.hide();
    this.current_form.show();

    InsertionMarker.setEnabled(true);
  },
    
  // Widget form
  setWidgetForm: function(id) {
    if (this.current_form)
      this.clearWidgetForm();

      var template = $(id);

      // Set insertion position
      $(id + 'Before').writeAttribute('value', Page.insert_before ? '1' : '0');
      $(id + 'Slot').writeAttribute('value', Page.insert_element ? Page.insert_element.readAttribute('slot') : '-1');

      // Form should go in the insertion bar, so we can change the insertion location and maintain
      // state
      this.current_form = template;
      this.revealForm();
  },

  clearWidgetForm: function() {
    if (!this.current_form)
      return;

    this.current_form.reset();
    this.current_form.hide();
    this.current_form = null;
  }
};

// Insertion marker which appears between slots
var InsertionMarker = {
  element: null,
  enabled: false,
  visible: false,

  init: function() {
    this.element = $('pageInsert');
    this.enabled = true;
    this.visible = false;
    Page.insert_element = null;
  },

  setEnabled: function(val) {
    this.enabled = val;
  },

  show: function(el, insert_before) {
    this.visible = true;
    this.set(el, insert_before);
    this.element.show();
    this.updateSlot(true);
  },

  hide: function() {
    if (this.visible) {
      this.element.hide();
      this.visible = false;
      this.updateSlot(false);
      if (this.enabled)
        this.set(null, true);
      }
  },

  updateSlot: function(active) {
    if (Page.insert_element == null)
      return;
    var el = Page.insert_before ? Page.insert_element : Page.next_element;
    if (el == null)
      return;
    if (active) {
      el.addClassName("InsertBefore");
    } else {
      el.removeClassName("InsertBefore");
    }
  },

  nextSlot: function() {
	if (Page.insert_element == null)
		return;
    var next = Page.insert_element.next();
    while (next != null && next.readAttribute('slot') == null) {
      next = next.next();
    }
    return next;
  },

  set: function(element, insert_before) {
    var el = element == null ? $(Element.getElementsBySelector($('slots'), '.pageSlot')[0]) : element;
    
    this.updateSlot(false);
    Page.insert_element = el;
    Page.next_element = this.nextSlot();
    Page.insert_before = el ? insert_before : true;
    if (this.visible)
      this.updateSlot(true);

    if (el == null)
      $('slots').insert({bottom: this.element});
    else if (insert_before)
      el.insert({before: this.element});
    else
      el.insert({after: this.element});
  }
};

// Hover observer for InsertionMarker
var InsertionMarkerFunc = function(evt){
  if (!InsertionMarker.enabled)
    return;

  var el = $(evt.target);
  var pt = evt.pointer();
  var offset = el.cumulativeOffset();

  if (!(pt.x - offset.left > Page.MARGIN))
  {
    // Show bar here *if* we are within the slot
    if (el.hasClassName('pageSlot'))
    {
      var h = el.getHeight(), thr = Math.min(h / 2, Page.SLOT_VERGE);
      var t = offset.top, b = t + h;

      // console.log(h + "," + thr + " | " + t + "," + b);

      if (el.hasClassName('pageFooter')) // before footer
        InsertionMarker.show(el, true);
      else if (pt.y - t <= thr) // before element
        InsertionMarker.show(el, true);
      else if (b - pt.y <= thr) // after element
        InsertionMarker.show(el, false);
      else
        InsertionMarker.hide(); // *poof*           
      }
  }
  else
  {
    // Ignore the insertion marker
    if (el.readAttribute('id') == "PIB") 
      return;

    InsertionMarker.hide(); // *poof*
  }
}
