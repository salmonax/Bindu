require 'sinatra'
require 'redcarpet'
require 'yomu'
require 'doc_ripper'

if development?
  require 'sinatra/reloader'
  require 'dotenv'
  Dotenv.load
end

enable :sessions
set :session_secret, ENV['SESSION_SECRET']

class Journal
  def self.init
    print "Creating/Updating Yomu journal..."
    @@filename = "/home/salmonax/Dropbox/Journal 2016 - Part 1.doc"
    @@second = "/home/salmonax/Dropbox/Journal 2015 - Part 3.doc"
    @@cached = File.mtime(@@filename)
    # @@text = Yomu.new(@@filename).text
    @@text = rip(@@filename) + rip(@@second)
    puts "Done!"
  end

  def self.text
    self.init if @@cached != File.mtime(@@filename)
    @@text
  end

  def self.rip(filename)
    DocRipper::TextRipper.new(filename).text
                  .gsub(/\u00e2\u0080(\u009C|\u009D)/,'"')
                  .gsub("\u00e2\u0080\u00a6","...")
                  # .gsub(/[^\n]\n\w/m,'')
  end
end

configure do
  Journal::init
end

get "/" do 
  haml :lagom
end

get "/calendar" do
  haml :calendar
end

get "/journal" do
  content_type :text
  Journal::text
end


get /(\d{4})/ do
  content_type :text
  year = params[:captures].first
  @filename = "/home/salmonax/Dropbox/Apps/Vicara/#{year} Pomodoro.txt"
  if File.exists?(@filename)
    File.read(@filename) 
  else
    "No Pomsheet for the year #{year}! Are you really me?!"
  end
end

__END__

@@ layout
!!!5
%html
  %head
    %script{src:"/javascripts/jquery-2.1.0.min.js"}
  %body
    =yield
    %script{src: "/javascripts/helpers.js"}
    %script{src: "/javascripts/utils.js"}
    %script{src: "/javascripts/parsley.js"}
    %script{src: "/javascripts/journal.js"}
  %script{src: "/javascripts/calendarView.js"}
  %script{src: "/javascripts/calendarController.js"}
  %script{src: "/javascripts/lagom.js"}
  %link{rel:"stylesheet",href:"/stylesheets/lagom.css"}
:css
  html, body {
    margin: 0; 
    height: 100%;
    color: white;
  }
  
@@ calendar
#calendar

@@ root
:markdown
  Welcome to Sinatra Minimal, a simple starter kit!
  ==
  Features:
  --
  - redcarpet for inline markdown
  - thin for webserver
  - sessions enabled, dotenv for .env loading
  - rack/guard-livereload for extensionless reloading
  - pushable to Heroku out of the box