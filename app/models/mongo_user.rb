require 'json'

class MongoUser
  include Mongoid::Document
  include Mongoid::Timestamps
  field :email
  field :hashed_password
  field :salt
  field :permission_level, :type => Integer, :default => 1

  # Validations
  validates_uniqueness_of :email
  validates_format_of :email, :with => /(\A(\s*)\Z)|(\A([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})\Z)/i
  validates_presence_of :password
  validates_confirmation_of :password

  has_many :searches
  has_many :mongoid_chords

  attr_accessor :password, :password_confirmation

  #attr_protected :_id, :salt

  def password=(pass)
    @password = pass
    self.salt = MongoUser.random_string(10) if !self.salt
    self.hashed_password = MongoUser.encrypt(@password, self.salt)
  end

  def admin?
    self.permission_level == -1 || self.id == 1
  end

  def site_admin?
    self.id == 1
  end

  def is_guest?
    self.email[0..4] == "guest"
  end

  def self.super_guest
    MongoUser.where(email: "super_guest@modalchords.io").first
  end 

  def self.authenticate(email, pass)
    current_user = MongoUser.where(:email => email).first
    return nil unless current_user
    return current_user if MongoUser.encrypt(pass, current_user.salt) == current_user.hashed_password
    nil
  end

  protected

  def self.encrypt(pass, salt)
    Digest::SHA1.hexdigest(pass+salt)
  end

  def self.random_string(len)
    #generate a random password consisting of strings and digits
    chars = ("a".."z").to_a + ("A".."Z").to_a + ("0".."9").to_a
    newpass = ""
    1.upto(len) { |i| newpass << chars[rand(chars.size-1)] }
    return newpass
  end

  def self.random_string_no_digits(len)
    #generate a random password consisting of strings
    chars = ("a".."z").to_a
    newpass = ""
    1.upto(len) { |i| newpass << chars[rand(chars.size-1)] }
    return newpass
  end

  def method_missing(m, *args)
    return false
  end
	
end

##### HELPERS #######

module Sinatra
  module Helpers

    def current_user
      MongoUser.where(_id: session[:user]).first
    end

    def guest_user?
      current_user.email[0..4] == "guest"
    end 
	
	  def create_guest_user

      salted_email= "guest#{MongoUser.random_string(10)}@modalchords.io"

	    guest_user= MongoUser.new email: salted_email, password: "password", password_confirmation: "password"
  	  master_user= MongoUser.super_guest

	    if guest_user.save(validate: false)
	    	if master_user

          master_user.searches.each do |x|
            new_search = x.clone
            new_search.save
            guest_user.searches.push new_search
          end 

          master_user.mongoid_chords.each do |x|
            new_chord = x.clone
            new_chord.save
            guest_user.mongoid_chords.push new_chord
          end

        else
          add_current_search_to_new_user guest_user
        end
        session[:user] = guest_user._id
	      "signup guest successful"
	    else
	      "something went wrong while guest signup"
	    end  
      guest_user
    end   

    def add_current_search_to_new_user user
      s=Search.create_from_current_settings("user_current_search")
      user.searches.push s
      if user.save
      	"current search succesfully created"
      else
        "current search creation bug"
      end  	
    end	
  end  
end

##### ROUTES #######

## UTILS ##

get '/logged_in' do
  if session[:user]
    "true"
  else
    "false"
  end
end

get "/ensure_user" do
	content_type(:json)
	create_guest_user if MongoUser.where(_id: session[:user]).empty? or !session[:user]
	current_user.to_json 
end	

get "/mongo_users/login/:email/:password" do
    content_type(:json)
    previous_user = current_user

	  if user = MongoUser.authenticate(params[:email], params[:password])
      session[:user] = user._id
      previous_user.destroy if previous_user.is_guest?
      user.to_json
    else
      false.to_json
    end
end	

get '/mongo_users/logout' do
  content_type(:json)
  session[:user] = nil
  guest= create_guest_user
  guest.to_json
end

get '/destroy_old_guests' do
  MongoUser.all.each do |u|
    if u.email[0..4] == "guest" and (Time.now-u.updated_at)/3600 > 24
      u.destroy
    end 
  end
end  

get "/mongo_users/signup/:email/:password/:password_confirmation" do
  content_type(:json)
    
	new_user= MongoUser.new email: params[:email],password: params[:password],password_confirmation: params[:password_confirmation]#params.reject {|k,v| k=="splat" or k=="captures"}

	if new_user.save 
    guest_user? ? mother_user = current_user : mother_user = super_guest
      
    mother_user.searches.each do |x|
      new_search = x.clone
      new_search.save
      new_user.searches.push new_search
    end 

    mother_user.mongoid_chords.each do |x|
      new_chord = x.clone
      new_chord.save
      new_user.mongoid_chords.push new_chord
    end

    new_user.save
    current_user.destroy if current_user.is_guest?
    session[:user] = new_user._id
	  new_user.to_json
  else
    false.to_json
  end
end	



## USER JSON API ##

#INDEX
get "/mongo_users" do
  content_type(:json)
  users= MongoUser.criteria.order_by([[:created_at, :desc]])
  users.to_json
end

#GET
get "/mongo_users/:_id" do
  content_type(:json)
  user=MongoUser.where(_id: params[:_id]).first
  user.to_json
end

#UPDATE
put "/mongo_users/:_id" do
  r= JSON.parse(request.body.read.to_s)
  user= MongoUser.where(_id: params[:_id]).first

  user.update_attributes r

  if user.save(validate: false)
    user.to_json
  else
    halt 500
  end

end 

#NEW 
post "/mongo_users" do
  content_type(:json)
  request_body = JSON.parse(request.body.read.to_s)

  new_user=MongoUser.new(request_body)

  if new_user.save
    new_user.to_json
  else
    halt 500
  end  
end  

#DELETE
delete "/mongo_users/:_id" do
  content_type(:json)
  user= MongoUser.where(_id: params[:_id]).first

  if user.destroy
    {:success => "ok"}.to_json
  else
    halt 500
  end
end  

#### AUTHENTICATION ###########



# post '/login' do
#   #p params
#   if user = MongoUser.authenticate(params[:email], params[:password])

#     session[:user] = user.id

#     if Rack.const_defined?('Flash')
#       flash[:notice] = "Login successful."
#     end
#     p "authenticated!"
#     #redirect '/'

#   else
#     if Rack.const_defined?('Flash')
#       flash[:notice] = "The email or password you entered is incorrect."
#     end
#     "fail"
#   end
# end

# get '/logout' do
#   session[:user] = nil
#   if Rack.const_defined?('Flash')
#     flash[:notice] = "Logout successful."
#   end
# end

# get '/signup' do
#   if session[:user]
#     redirect '/'
#   else
#     #haml get_view_as_string("signup.haml"), :layout => use_layout?
#     haml :_signup, :layout => use_layout?
#   end
# end

# post '/signup' do
#   @user = User.set(params[:user])
#   if @user.valid && @user.id
#     session[:user] = @user.id
#     if Rack.const_defined?('Flash')
#       flash[:notice] = "Account created."
#     end
#     redirect '/'
#   else
#     if Rack.const_defined?('Flash')
#       flash[:notice] = "There were some problems creating your account: #{@user.errors}."
#     end
#     redirect '/signup?' + hash_to_query_string(params['user'])
#   end
# end




