/* Globals: configuration, optionalPermissions */

;(function() {

  // -----------------------------------------------------------------------------
  // Models

  var expirationTime = {
    parseValue: function(value) {
      value = parseInt(value, 10)
      return value && value > 0 ? value : null
    }
  }

  var disabledUrls = {
    toArray: function(domains) {
      var array = []

      if (domains) {
        domains = domains.split('\n')

        for (var i = 0; i < domains.length; i++) {
          if (! isEmptyString(domains[i]) && array.indexOf(domains[i]) === -1) array.push(domains[i])
        }
      }

      return array
    },

    fromArray: function(domains) {
      return domains  ? domains.join('\n') : ''
    }
  }

  var options = {
    htmlElements: {},

    setCurrentSaved: function() {
      configuration.forEachCurrent(function(key, value) {
        var element = options.htmlElements[key]

        if (element.type === 'checkbox') {
          element.checked = value
        } else {
          if (key === 'disabledUrls') {
            element.value = disabledUrls.fromArray(value)
          } else {
            element.value = value
          }
        }
      })
    },

    getFromHTML: function() {
      var newValues = {}

      configuration.forEachDefault(function(key, value) {
        var element = options.htmlElements[key]
        if (! element) return

        if (element.type === 'checkbox') {
          newValues[key] = element.checked
        } else {
          if (key === 'disabledUrls') {
            newValues[key] = disabledUrls.toArray(element.value)
          } else if (key === 'expirationTime') {
            newValues[key] = expirationTime.parseValue(element.value)
          } else {
            newValues[key] = element.value.trim()
          }
        }
      })

      return newValues
    }
  }
  configuration.forEachDefault(function (key, value) {
    options.htmlElements[key] = document.getElementById(key) // setup the htmlElements property
  })


  // -----------------------------------------------------------------------------
  // Events

  var saveTimeout = null

  addEventListener('#js-save', 'submit', function save(event) {
    var notice = document.getElementById('notice')
    var newValues = options.getFromHTML()

    configuration.set(newValues, function () {
      notice.classList.remove('hidden')
      window.scrollTo(0, document.body.scrollHeight)
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(function() { notice.classList.add('hidden') }, 4000)
    })

    ga('send', 'event', 'Options', 'save', 'Saved options, with the configuration: ' + JSON.stringify(newValues))

    options.setCurrentSaved()
    event.preventDefault()
  })


  addEventListener('.js-icon-click-example', 'click', function() {
    var iconUrlInput = document.getElementById('iconClickURL')
    var href = this.dataset.href

    iconUrlInput.value = href
  })


  addEventListener('.js-disable-example', 'click', function() {
    var domainsTextarea = document.getElementById('disabledUrls')
    var currentDomains = disabledUrls.toArray(domainsTextarea.value)
    var href = this.dataset.href

    if (currentDomains.length === 0) {
      domainsTextarea.value = href
    } else if (currentDomains.indexOf(href) === -1) {
      domainsTextarea.value += '\n' + href
    }
  })


  addEventListener('#js-toggle-advanced', 'click', function() {
    var status = {
      visible: {
        text: 'Show advanced',
        action: function(el) { el.classList.add('hidden') },
        counterpart: 'hidden'
      },
      hidden: {
        text: 'Hide advanced',
        action: function(el) { el.classList.remove('hidden') },
        counterpart: 'visible'
      }
    }[this.dataset.advancedStatus]

    forEachDomElement('.advanced-options', status.action)
    this.textContent = status.text
    this.dataset.advancedStatus = status.counterpart
  })


  addEventListener('#js-close-notice', 'click', function() {
    this.parentElement.classList.add('hidden')
  })

  addEventListener('#js-request-tab-permissions', 'click', function() {
    optionalPermissions.request('tabs', function(wasAllowed) {
      if (wasAllowed) {
        var container = document.getElementById('js-tab-permissions')
        container.classList.add('fade-out')
        setTimeout(function() { container.classList.remove('visible') }, 700)
      }
    })
  })

  // -----------------------------------------------------------------------------
  // Start

  chrome.storage.local.get({ justUpdated: 0 }, function(items) {
    if (items.justUpdated > 0) {
      var newItems = document.getElementsByClassName('new')

      for (var i = 0; i < newItems.length; i++) {
        newItems[i].classList.remove('hidden')
      }

      items.justUpdated -= 1

      chrome.storage.local.set({ justUpdated: items.justUpdated })
    }
  })

  options.setCurrentSaved()

  setTimeout(function() {
    document.querySelector('.configuration').classList.add('visible')
  }, 5)

  optionalPermissions.isGranted('tabs', function(isGranted) {
    var container = document.getElementById('js-tab-permissions')

    if (isGranted) {
      container.classList.add('hidden')
    } else {
      container.classList.add('visible')
    }
  })

  // -----------------------------------------------------------------------------
  // Utils

  function addEventListener(selector, event, callback) {
    forEachDomElement(selector, function(element) {
      element.addEventListener(event, callback, false)
    })
  }

  function isEmptyString(str) {
    return ! str || ! str.trim()
  }

  function forEachDomElement(selector, callback) {
    var elements = document.querySelectorAll(selector)
    return Array.prototype.forEach.call(elements, callback)
  }
})()
