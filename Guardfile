# A sample Guardfile
# More info at https://github.com/guard/guard#readme

ignore /node_modules/, /.git/, /.sass-cache/

guard 'livereload' do
  watch(%r{.+\.rb})
  watch(%r{views/.+\.(erb|haml|slim)$})
  watch(%r{app/helpers/.+\.rb})
  watch(%r{public/.+\.(sass|css|js|html)})
  watch(%r{config/locales/.+\.yml})
  # Rails-stylle Assets Pipeline
  # watch(%r{(app|vendor)(/assets/\w+/(.+\.(css|js|html|png|jpg))).*}) { |m| "/assets/#{m[3]}" }
end
