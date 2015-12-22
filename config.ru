require './app'
require 'rack-livereload'
require 'sass/plugin/rack'

use Rack::LiveReload

Sass::Plugin.options[:style] = :compressed
use Sass::Plugin::Rack

run Sinatra::Application