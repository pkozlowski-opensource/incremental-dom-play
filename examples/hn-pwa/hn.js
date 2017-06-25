var NAV_ITEMS = ['top', 'new', 'show', 'ask', 'jobs'];

function link(c, idx, href, linkText) {
  c = elementStart(c, idx, 'a', {href: href});
    c = text(c, 0, linkText);
  c = elementEnd(c);

  return c;
}

function navClick(navItem) {
  vm.selected = navItem;
  refresh();
}

function commentsClick(itemId, noOfComments) {
  console.log(itemId, noOfComments);
}

function userClick(user) {
  console.log(user);
}

function navHeader(c, selected) {
  var navItem;

  c = elementStart(c, 0, 'header');
    c = elementStart(c, 0, 'nav');
      c = elementStart(c, 0, 'ul');

        NAV_ITEMS.forEach(function(navItem) {
          c = elementStart(c, 0, 'li');
            c = elementStart(c, 0, 'a', {href: '/' + navItem + '/1'}, {className: navItem === selected ? 'selected': ''}, {
              click: function($event) {
                $event.preventDefault();
                navClick(navItem);
              }
            });
              c = text(c, 0, navItem);
            c = elementEnd(c);
          c = elementEnd(c);
        });

        c = elementStart(c, 0, 'li', {className: 'about'});
          c = elementStart(c, 0, 'a', {href: '/about'});
            c = text(c, 0, 'about');
          c = elementEnd(c);
        c = elementEnd(c);
      c = elementEnd(c);
    c = elementEnd(c);
  c = elementEnd(c);

  return c;
}

function hnApp(c, vm) {
  var data = vm.response;
  var dataLen = data.length;

  // header
  c = view(c, 0, navHeader, vm.selected);

  // main
  c = elementStart(c, 0, 'main');
  for (var i=0; i<dataLen; i++) {
    let article = data[i];

    c = elementStart(c, 0, 'article');
      // article title and link
      c = elementStart(c, 0, 'h2');
        c = elementStart(c, 0, 'a', {href: article.url});
          c = text(c, 0, article.title);
          c = elementStart(c, 1, 'small');
            c = text(c, 0, ' (' + article.domain + ')');
          c = elementEnd(c);
        c = elementEnd(c);
      c = elementEnd(c);

      // article footer (user, no of comments etc.)
      c = elementStart(c, 1, 'p');
        c = text(c, 0, article.points + ' points by ');
        c = elementStart(c, 1, 'a', {href: '/users/' + article.user}, null, {
          click: function($event) {
            $event.preventDefault(); userClick(article.user);
          }
        });
          c = text(c, 0, article.user);
        c = elementEnd(c);
        c = text(c, 2, ' ' + article.time_ago + ' | ');
        c = elementStart(c, 1, 'a', {href: '/item/' + article.id}, null, {
          click: function($event) {
            $event.preventDefault();
            commentsClick(article.id, article.comments_count);
          }
        });
          c = text(c, 0, article.comments_count + ' comments');
        c = elementEnd(c);
      c = elementEnd(c);

      // index number
      c = elementStart(c, 2, 'span', {className: 'index'});
        c = text(c, 0, i + 1);
      c = elementEnd(c);

    c = elementEnd(c); //article end
  }
    c = link(c, 1, 'top/2', 'More....');

  c = elementEnd(c); //main end



  return c;
}