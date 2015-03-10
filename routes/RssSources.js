function RssSources() {
}
RssSources.animelehti = {
   id: 0,
   uri: 'http://animelehti.fi/feed/'
}
RssSources.tokiofi = {
   id: 1,
   uri: 'http://tokio.fi/rss.php'
}
RssSources.ANIMELEHTI = RssSources.animelehti.id;
RssSources.TOKIO_FI = RssSources.tokiofi.id;

module.exports = RssSources;
module.exports.MAX_NEWS = 9;